//! # engine-ipc
//!
//! Capability-based inter-process communication for Browser 2030B.
//!
//! The production transport is Cap'n Proto over mutually authenticated Unix
//! domain sockets / named pipes (see `docs/00-architecture.md` §3). This crate
//! implements the *capability model* — unforgeable, origin-bound, expiring
//! tokens that grant the bearer a precise, non-wideable authority — on top of
//! the std library so it builds in any environment. The Cap'n Proto wire codec
//! is gated behind the `capnp` feature and wired in for real builds.
//!
//! ## Object-capability principle
//!
//! No process holds ambient authority. To perform an action a process must
//! present a [`Capability`] minted by the broker. A process can *attenuate*
//! (narrow) a capability it holds but can never *amplify* it.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// A coarse-grained authority that a capability can grant.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Authority {
    /// Initiate a network fetch.
    NetworkFetch,
    /// Read from the profile storage.
    StorageRead,
    /// Write to the profile storage.
    StorageWrite,
    /// Drive UI actuation (used by Agent Mode).
    AgentActuate,
    /// Observe the AI copilot context.
    AiObserve,
    /// Call the local on-device model.
    AiLocal,
    /// Call an admin-allowed remote model endpoint.
    AiRemote,
    /// Render content for a given origin.
    Render,
}

/// Errors produced by the capability subsystem.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IpcError {
    /// The presented capability has expired.
    Expired,
    /// The capability does not grant the requested authority.
    Unauthorized,
    /// The capability is bound to a different origin.
    OriginMismatch,
    /// Attempt to amplify authority during attenuation.
    Amplification,
    /// The capability token was not minted by this broker (bad signature/id).
    Forged,
}

impl std::fmt::Display for IpcError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            IpcError::Expired => "capability expired",
            IpcError::Unauthorized => "capability does not grant this authority",
            IpcError::OriginMismatch => "capability bound to a different origin",
            IpcError::Amplification => "attenuation may not amplify authority",
            IpcError::Forged => "capability not recognized by broker",
        };
        f.write_str(s)
    }
}

impl std::error::Error for IpcError {}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// An unforgeable, origin-bound, expiring grant of authority.
///
/// In production the `id` is backed by a MAC computed with the broker's secret
/// key; here it is a monotonically increasing nonce registered with the
/// [`Broker`] that minted it, which is sufficient to model non-forgeability
/// within the process boundary and in tests.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Capability {
    id: u64,
    origin: String,
    authorities: Vec<Authority>,
    expires_at: u64,
}

impl Capability {
    /// The origin this capability is bound to (eTLD+1 or scheme://host:port).
    pub fn origin(&self) -> &str {
        &self.origin
    }

    /// Whether this capability has expired relative to the current time.
    pub fn is_expired(&self) -> bool {
        now_secs() >= self.expires_at
    }

    /// Whether this capability grants `authority`.
    pub fn grants(&self, authority: Authority) -> bool {
        self.authorities.contains(&authority)
    }

    /// Produce a *narrower* capability. The resulting authorities must be a
    /// subset of `self`'s, and the expiry may only move earlier. Any attempt to
    /// add authority or extend lifetime returns [`IpcError::Amplification`].
    pub fn attenuate(
        &self,
        authorities: &[Authority],
        expires_at: u64,
    ) -> Result<Capability, IpcError> {
        if expires_at > self.expires_at {
            return Err(IpcError::Amplification);
        }
        for a in authorities {
            if !self.authorities.contains(a) {
                return Err(IpcError::Amplification);
            }
        }
        Ok(Capability {
            id: self.id,
            origin: self.origin.clone(),
            authorities: authorities.to_vec(),
            expires_at,
        })
    }
}

/// The privileged broker that mints and verifies capabilities.
///
/// All authority in the system flows from the broker. Renderer, extension, AI,
/// and agent processes receive only attenuated capabilities and can never widen
/// them.
#[derive(Debug, Default)]
pub struct Broker {
    next_id: AtomicU64,
    /// Registry of minted capability ids → origin, used to reject forged ids.
    issued: std::sync::Mutex<HashMap<u64, String>>,
}

impl Broker {
    /// Create a new broker.
    pub fn new() -> Self {
        Broker {
            next_id: AtomicU64::new(1),
            issued: std::sync::Mutex::new(HashMap::new()),
        }
    }

    /// Mint a fresh capability for `origin` granting `authorities`, valid for
    /// `ttl_secs` seconds.
    pub fn mint(&self, origin: &str, authorities: &[Authority], ttl_secs: u64) -> Capability {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        self.issued
            .lock()
            .expect("broker registry poisoned")
            .insert(id, origin.to_string());
        Capability {
            id,
            origin: origin.to_string(),
            authorities: authorities.to_vec(),
            expires_at: now_secs() + ttl_secs,
        }
    }

    /// Verify that a capability is one this broker minted, is unexpired, is
    /// bound to `expected_origin`, and grants `authority`.
    pub fn verify(
        &self,
        cap: &Capability,
        expected_origin: &str,
        authority: Authority,
    ) -> Result<(), IpcError> {
        let issued = self.issued.lock().expect("broker registry poisoned");
        match issued.get(&cap.id) {
            Some(o) if o == &cap.origin => {}
            _ => return Err(IpcError::Forged),
        }
        if cap.is_expired() {
            return Err(IpcError::Expired);
        }
        if cap.origin != expected_origin {
            return Err(IpcError::OriginMismatch);
        }
        if !cap.grants(authority) {
            return Err(IpcError::Unauthorized);
        }
        Ok(())
    }

    /// Revoke a capability id (e.g. on permission change or uninstall).
    pub fn revoke(&self, cap: &Capability) {
        self.issued
            .lock()
            .expect("broker registry poisoned")
            .remove(&cap.id);
    }
}

/// A framed IPC message tagged with the capability authorizing it.
#[derive(Debug, Clone)]
pub struct Message {
    /// Logical channel / method name (maps to a Cap'n Proto interface method).
    pub method: String,
    /// Opaque payload (Cap'n Proto-encoded in production).
    pub payload: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mint_and_verify_roundtrip() {
        let broker = Broker::new();
        let cap = broker.mint("https://example.com", &[Authority::NetworkFetch], 60);
        assert!(broker
            .verify(&cap, "https://example.com", Authority::NetworkFetch)
            .is_ok());
    }

    #[test]
    fn origin_binding_enforced() {
        let broker = Broker::new();
        let cap = broker.mint("https://a.example", &[Authority::Render], 60);
        assert_eq!(
            broker.verify(&cap, "https://b.example", Authority::Render),
            Err(IpcError::OriginMismatch)
        );
    }

    #[test]
    fn unauthorized_authority_rejected() {
        let broker = Broker::new();
        let cap = broker.mint("https://a.example", &[Authority::Render], 60);
        assert_eq!(
            broker.verify(&cap, "https://a.example", Authority::NetworkFetch),
            Err(IpcError::Unauthorized)
        );
    }

    #[test]
    fn attenuation_cannot_amplify() {
        let broker = Broker::new();
        let cap = broker.mint("https://a.example", &[Authority::Render], 60);
        // Adding an authority not present must fail.
        assert_eq!(
            cap.attenuate(&[Authority::NetworkFetch], cap.expires_at),
            Err(IpcError::Amplification)
        );
        // Extending lifetime must fail.
        assert_eq!(
            cap.attenuate(&[Authority::Render], cap.expires_at + 1),
            Err(IpcError::Amplification)
        );
        // Narrowing is allowed.
        assert!(cap.attenuate(&[], cap.expires_at).is_ok());
    }

    #[test]
    fn forged_capability_rejected() {
        let broker = Broker::new();
        let other = Broker::new();
        // Cap minted by `other` is unknown to `broker`.
        let cap = other.mint("https://a.example", &[Authority::Render], 60);
        assert_eq!(
            broker.verify(&cap, "https://a.example", Authority::Render),
            Err(IpcError::Forged)
        );
    }

    #[test]
    fn revocation_works() {
        let broker = Broker::new();
        let cap = broker.mint("https://a.example", &[Authority::Render], 60);
        broker.revoke(&cap);
        assert_eq!(
            broker.verify(&cap, "https://a.example", Authority::Render),
            Err(IpcError::Forged)
        );
    }
}

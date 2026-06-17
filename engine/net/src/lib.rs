//! # engine-net
//!
//! The Browser 2030B networking layer. The production stack uses QUIC/HTTP/3
//! (quinn), TLS 1.3 with hybrid post-quantum key exchange (rustls + ML-KEM),
//! DNS-over-HTTPS/QUIC with ECH, and Oblivious HTTP for telemetry/updates. This
//! crate implements the *policy and negotiation logic* on top of std so it
//! compiles everywhere; the transport backends are gated behind features.
//!
//! See `docs/00-architecture.md` §5 and `docs/04-2030-forward-features.md` §5.

pub mod https_only;
pub mod pqc;
pub mod tls;
pub mod tracking_protection;

/// Supported application transports, in preference order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Transport {
    /// HTTP/3 over QUIC — the default.
    Http3,
    /// HTTP/2 over TLS — fallback.
    Http2,
    /// HTTP/1.1 — only when explicitly enabled by policy.
    Http11,
}

/// Network policy knobs resolved from the Administrative Configuration Plane.
#[derive(Debug, Clone)]
pub struct NetPolicy {
    /// Allow plaintext HTTP/1.1 at all.
    pub allow_http11: bool,
    /// HTTPS-Only / HTTPS-First behavior.
    pub https_mode: https_only::HttpsMode,
    /// Post-quantum KEM enforcement level.
    pub pq_kem: pqc::PqEnforcement,
}

impl Default for NetPolicy {
    fn default() -> Self {
        // Default-deny / most-secure defaults.
        NetPolicy {
            allow_http11: false,
            https_mode: https_only::HttpsMode::HttpsOnly,
            pq_kem: pqc::PqEnforcement::Preferred,
        }
    }
}

/// Negotiate the application transport given the server's advertised ALPN set
/// and the active policy.
pub fn negotiate_transport(server_alpn: &[&str], policy: &NetPolicy) -> Option<Transport> {
    if server_alpn.contains(&"h3") {
        return Some(Transport::Http3);
    }
    if server_alpn.contains(&"h2") {
        return Some(Transport::Http2);
    }
    if server_alpn.contains(&"http/1.1") && policy.allow_http11 {
        return Some(Transport::Http11);
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_h3_then_h2() {
        let p = NetPolicy::default();
        assert_eq!(
            negotiate_transport(&["h2", "h3", "http/1.1"], &p),
            Some(Transport::Http3)
        );
        assert_eq!(
            negotiate_transport(&["h2", "http/1.1"], &p),
            Some(Transport::Http2)
        );
    }

    #[test]
    fn http11_blocked_by_default() {
        let p = NetPolicy::default();
        assert_eq!(negotiate_transport(&["http/1.1"], &p), None);
    }

    #[test]
    fn http11_allowed_when_policy_opts_in() {
        let p = NetPolicy {
            allow_http11: true,
            ..NetPolicy::default()
        };
        assert_eq!(
            negotiate_transport(&["http/1.1"], &p),
            Some(Transport::Http11)
        );
    }
}

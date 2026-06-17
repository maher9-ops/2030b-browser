//! # engine-storage
//!
//! Per-profile encrypted storage for Browser 2030B: profiles, site settings,
//! the memory saver, and the on-device semantic history index. Encryption at
//! rest uses the profile key (production: XChaCha20-Poly1305); this crate models
//! the data structures and policy logic over std.

pub mod memory_saver;
pub mod semantic_history;
pub mod site_settings;

/// A browser profile (normal, guest, incognito, or Tor).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    pub id: String,
    pub kind: ProfileKind,
    /// Incognito/Tor profiles use an isolated, ephemeral network stack.
    pub isolated_network: bool,
}

/// The kind of profile, which dictates persistence and isolation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProfileKind {
    Normal,
    Guest,
    Incognito,
    Tor,
}

impl Profile {
    /// Create a profile, applying the correct isolation defaults per kind.
    pub fn new(id: &str, kind: ProfileKind) -> Self {
        let isolated_network = matches!(kind, ProfileKind::Incognito | ProfileKind::Tor);
        Profile {
            id: id.to_string(),
            kind,
            isolated_network,
        }
    }

    /// Whether this profile persists data to disk after the session ends.
    pub fn persists(&self) -> bool {
        matches!(self.kind, ProfileKind::Normal)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn incognito_is_isolated_and_ephemeral() {
        let p = Profile::new("inc-1", ProfileKind::Incognito);
        assert!(p.isolated_network);
        assert!(!p.persists());
    }

    #[test]
    fn normal_profile_persists() {
        let p = Profile::new("default", ProfileKind::Normal);
        assert!(!p.isolated_network);
        assert!(p.persists());
    }
}

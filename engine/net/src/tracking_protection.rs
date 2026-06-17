//! Enhanced Tracking Protection with Total Cookie Protection (Firefox §6.2).
//!
//! State is partitioned by top-level site (double-keyed) so that third-party
//! storage cannot be used to link a user across first-party contexts.

/// Tracking protection strength.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EtpLevel {
    /// Block known trackers in private windows and some in normal windows.
    Standard,
    /// Block known trackers everywhere; may break some sites.
    Strict,
    /// User-defined category set.
    Custom,
}

/// A storage access decision for a (top-level site, embedded origin) pair.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StorageDecision {
    /// Grant access in a partition keyed by the top-level site.
    Partitioned { partition_key: String },
    /// Deny storage entirely (known tracker under Strict).
    Blocked,
}

/// Compute a partition key for double-keyed (top-level + embedded) storage.
pub fn partition_key(top_level_site: &str, embedded_origin: &str) -> String {
    format!("{top_level_site}|{embedded_origin}")
}

/// Decide storage access for an embedded origin under the given ETP level.
pub fn decide_storage(
    top_level_site: &str,
    embedded_origin: &str,
    level: EtpLevel,
    is_known_tracker: bool,
) -> StorageDecision {
    match (level, is_known_tracker) {
        (EtpLevel::Strict, true) => StorageDecision::Blocked,
        _ => StorageDecision::Partitioned {
            partition_key: partition_key(top_level_site, embedded_origin),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strict_blocks_known_trackers() {
        assert_eq!(
            decide_storage(
                "https://news.example",
                "https://tracker.example",
                EtpLevel::Strict,
                true
            ),
            StorageDecision::Blocked
        );
    }

    #[test]
    fn non_tracker_gets_partitioned_storage() {
        let d = decide_storage(
            "https://news.example",
            "https://cdn.example",
            EtpLevel::Standard,
            false,
        );
        assert_eq!(
            d,
            StorageDecision::Partitioned {
                partition_key: "https://news.example|https://cdn.example".into()
            }
        );
    }

    #[test]
    fn same_third_party_different_top_level_is_unlinkable() {
        let a = partition_key("https://site-a.example", "https://t.example");
        let b = partition_key("https://site-b.example", "https://t.example");
        assert_ne!(a, b);
    }
}

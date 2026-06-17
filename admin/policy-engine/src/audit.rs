//! Tamper-evident audit log via a Merkle tree (build brief §7.9, §2 compliance).
//!
//! Each appended entry is hashed; the log maintains a Merkle root over all
//! entries so any modification to a past entry changes the root, making
//! tampering evident. Production anchors the root to a public ledger
//! periodically. We use a small FNV-1a-based hash so the crate stays std-only;
//! production swaps in SHA-256.

fn hash_bytes(data: &[u8]) -> u64 {
    let mut h: u64 = 1469598103934665603;
    for b in data {
        h ^= *b as u64;
        h = h.wrapping_mul(1099511628211);
    }
    h
}

fn hash_pair(a: u64, b: u64) -> u64 {
    let mut buf = [0u8; 16];
    buf[..8].copy_from_slice(&a.to_be_bytes());
    buf[8..].copy_from_slice(&b.to_be_bytes());
    hash_bytes(&buf)
}

/// An append-only, tamper-evident log.
#[derive(Debug, Default)]
pub struct AuditLog {
    leaves: Vec<u64>,
}

impl AuditLog {
    pub fn new() -> Self {
        AuditLog { leaves: Vec::new() }
    }

    /// Append an entry (e.g. a serialized [`crate::provenance::DecisionSpan`]).
    pub fn append(&mut self, entry: &str) {
        self.leaves.push(hash_bytes(entry.as_bytes()));
    }

    /// Compute the current Merkle root over all entries. Empty log => 0.
    pub fn root(&self) -> u64 {
        if self.leaves.is_empty() {
            return 0;
        }
        let mut level = self.leaves.clone();
        while level.len() > 1 {
            let mut next = Vec::with_capacity(level.len().div_ceil(2));
            let mut i = 0;
            while i < level.len() {
                if i + 1 < level.len() {
                    next.push(hash_pair(level[i], level[i + 1]));
                } else {
                    // Odd node is promoted (duplicated) to the next level.
                    next.push(hash_pair(level[i], level[i]));
                }
                i += 2;
            }
            level = next;
        }
        level[0]
    }

    pub fn len(&self) -> usize {
        self.leaves.len()
    }

    pub fn is_empty(&self) -> bool {
        self.leaves.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn root_changes_when_history_tampered() {
        let mut log = AuditLog::new();
        log.append("decision A");
        log.append("decision B");
        let root_before = log.root();

        // Reconstruct with a tampered first entry.
        let mut tampered = AuditLog::new();
        tampered.append("decision A (modified)");
        tampered.append("decision B");
        assert_ne!(root_before, tampered.root());
    }

    #[test]
    fn append_grows_log_and_changes_root() {
        let mut log = AuditLog::new();
        log.append("one");
        let r1 = log.root();
        log.append("two");
        assert_eq!(log.len(), 2);
        assert_ne!(r1, log.root());
    }

    #[test]
    fn empty_root_is_zero() {
        assert_eq!(AuditLog::new().root(), 0);
    }
}

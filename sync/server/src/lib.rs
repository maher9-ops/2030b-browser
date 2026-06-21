//! # sync-server
//!
//! A self-hostable, **zero-knowledge** sync server (build brief §6.3). It stores
//! opaque ciphertext blobs keyed by (account, collection, record-id) and serves
//! them back. It never possesses key material and cannot read any record. Also
//! hosts the self-hostable read-later / relay reference endpoints.

use std::collections::HashMap;

/// An opaque, server-stored blob. The server treats the bytes as meaningless.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Blob {
    pub nonce: [u8; 24],
    pub ciphertext: Vec<u8>,
    /// Monotonic version for last-writer-wins conflict resolution.
    pub version: u64,
}

/// Key identifying a record within an account's collection.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct RecordKey {
    pub account: String,
    pub collection: String,
    pub record_id: String,
}

/// The in-memory zero-knowledge store (production: durable + replicated).
#[derive(Debug, Default)]
pub struct SyncStore {
    records: HashMap<RecordKey, Blob>,
}

impl SyncStore {
    pub fn new() -> Self {
        SyncStore {
            records: HashMap::new(),
        }
    }

    /// Upsert a record. Rejects stale writes (version must be >= existing).
    pub fn put(&mut self, key: RecordKey, blob: Blob) -> Result<(), &'static str> {
        if let Some(existing) = self.records.get(&key) {
            if blob.version < existing.version {
                return Err("stale write: version older than stored");
            }
        }
        self.records.insert(key, blob);
        Ok(())
    }

    /// Fetch a record's ciphertext (the only thing the server can return).
    pub fn get(&self, key: &RecordKey) -> Option<&Blob> {
        self.records.get(key)
    }

    /// List record ids in a collection (metadata only; no plaintext exists).
    pub fn list(&self, account: &str, collection: &str) -> Vec<String> {
        self.records
            .keys()
            .filter(|k| k.account == account && k.collection == collection)
            .map(|k| k.record_id.clone())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key() -> RecordKey {
        RecordKey {
            account: "acct".into(),
            collection: "bookmarks".into(),
            record_id: "1".into(),
        }
    }

    #[test]
    fn put_and_get() {
        let mut s = SyncStore::new();
        let blob = Blob {
            nonce: [0u8; 24],
            ciphertext: vec![9, 9, 9],
            version: 1,
        };
        s.put(key(), blob.clone()).unwrap();
        assert_eq!(s.get(&key()), Some(&blob));
    }

    #[test]
    fn rejects_stale_write() {
        let mut s = SyncStore::new();
        s.put(
            key(),
            Blob {
                nonce: [0u8; 24],
                ciphertext: vec![1],
                version: 5,
            },
        )
        .unwrap();
        let err = s.put(
            key(),
            Blob {
                nonce: [0u8; 24],
                ciphertext: vec![2],
                version: 4,
            },
        );
        assert!(err.is_err());
    }

    #[test]
    fn list_collection() {
        let mut s = SyncStore::new();
        s.put(
            key(),
            Blob {
                nonce: [0u8; 24],
                ciphertext: vec![1],
                version: 1,
            },
        )
        .unwrap();
        assert_eq!(s.list("acct", "bookmarks"), vec!["1".to_string()]);
    }
}

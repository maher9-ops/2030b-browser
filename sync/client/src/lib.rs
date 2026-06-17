//! # sync-client
//!
//! Encrypts sync records locally with the user's key before upload, so the
//! server only ever sees ciphertext. Supports all synced data types (Chrome
//! §5.6, Firefox §6.3): bookmarks, history, passwords, open tabs, extensions,
//! settings, payment methods, addresses, themes.

use e2ee::{open, seal, SealedRecord, UserKey};

/// The categories of data Browser 2030B synchronizes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DataType {
    Bookmarks,
    History,
    Passwords,
    OpenTabs,
    Extensions,
    Settings,
    PaymentMethods,
    Addresses,
    Themes,
}

/// A locally-prepared record ready to upload (ciphertext + type tag).
#[derive(Debug, Clone)]
pub struct OutgoingRecord {
    pub data_type: DataType,
    pub sealed: SealedRecord,
}

/// Prepare a record for upload: serialize then encrypt with the user's key.
pub fn prepare_upload(
    key: &UserKey,
    data_type: DataType,
    nonce: [u8; 24],
    plaintext: &[u8],
) -> OutgoingRecord {
    OutgoingRecord {
        data_type,
        sealed: seal(key, nonce, plaintext),
    }
}

/// Decrypt a downloaded record with the user's key.
pub fn apply_download(key: &UserKey, record: &SealedRecord) -> Vec<u8> {
    open(key, record)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn upload_then_download_roundtrips() {
        let key = UserKey::derive("device-pass", b"salt");
        let rec = prepare_upload(
            &key,
            DataType::Bookmarks,
            [3u8; 24],
            b"https://rust-lang.org",
        );
        // Server stores rec.sealed only; client downloads it and decrypts.
        assert_eq!(apply_download(&key, &rec.sealed), b"https://rust-lang.org");
        assert_eq!(rec.data_type, DataType::Bookmarks);
    }
}

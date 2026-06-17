//! # e2ee
//!
//! End-to-end encryption primitives for Browser 2030B sync. The server is
//! **zero-knowledge**: it stores only ciphertext and never holds key material
//! (build brief §5.6, §6.3, §12). Production uses XChaCha20-Poly1305 with keys
//! derived from the user's passphrase via Argon2id, and post-quantum-protected
//! key wrapping. This crate models the seal/open contract and key separation
//! over std (a documented XOR keystream stand-in) so the data-flow invariants
//! are testable without crypto dependencies.
//!
//! SECURITY NOTE: the std-only cipher here is a stand-in for testing the
//! protocol shape ONLY. Real builds MUST enable the `aead` backend
//! (XChaCha20-Poly1305). Never ship the stand-in.

/// A symmetric key held only on the user's devices.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserKey {
    bytes: [u8; 32],
}

impl UserKey {
    /// Derive a key from a passphrase + salt. Production: Argon2id. Here: a
    /// documented FNV-based KDF stand-in, sufficient to model device-held keys.
    pub fn derive(passphrase: &str, salt: &[u8]) -> Self {
        let mut bytes = [0u8; 32];
        for (i, b) in bytes.iter_mut().enumerate() {
            let mut h: u64 = 1469598103934665603 ^ (i as u64);
            for x in passphrase.bytes().chain(salt.iter().copied()) {
                h ^= x as u64;
                h = h.wrapping_mul(1099511628211);
            }
            *b = (h & 0xff) as u8;
        }
        UserKey { bytes }
    }
}

/// A sealed (encrypted) record as stored by the zero-knowledge server.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SealedRecord {
    pub nonce: [u8; 24],
    pub ciphertext: Vec<u8>,
}

fn keystream_xor(key: &UserKey, nonce: &[u8; 24], data: &[u8]) -> Vec<u8> {
    // Documented stand-in keystream: H(key || nonce || counter). NOT secure;
    // replaced by XChaCha20 in real builds.
    let mut out = Vec::with_capacity(data.len());
    for (i, byte) in data.iter().enumerate() {
        let mut h: u64 = 1469598103934665603;
        for x in key.bytes.iter().chain(nonce.iter()) {
            h ^= *x as u64;
            h = h.wrapping_mul(1099511628211);
        }
        h ^= i as u64;
        h = h.wrapping_mul(1099511628211);
        out.push(byte ^ (h & 0xff) as u8);
    }
    out
}

/// Seal plaintext into a record the server can store but not read.
pub fn seal(key: &UserKey, nonce: [u8; 24], plaintext: &[u8]) -> SealedRecord {
    SealedRecord {
        nonce,
        ciphertext: keystream_xor(key, &nonce, plaintext),
    }
}

/// Open a sealed record with the user's key.
pub fn open(key: &UserKey, record: &SealedRecord) -> Vec<u8> {
    keystream_xor(key, &record.nonce, &record.ciphertext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_seal_open() {
        let key = UserKey::derive("correct horse battery staple", b"salt");
        let nonce = [7u8; 24];
        let sealed = seal(&key, nonce, b"my bookmarks");
        assert_ne!(sealed.ciphertext, b"my bookmarks");
        assert_eq!(open(&key, &sealed), b"my bookmarks");
    }

    #[test]
    fn wrong_key_cannot_recover_plaintext() {
        let key = UserKey::derive("pass-a", b"salt");
        let wrong = UserKey::derive("pass-b", b"salt");
        let sealed = seal(&key, [1u8; 24], b"secret");
        assert_ne!(open(&wrong, &sealed), b"secret");
    }

    #[test]
    fn server_view_is_ciphertext_only() {
        let key = UserKey::derive("p", b"s");
        let sealed = seal(&key, [0u8; 24], b"history entry");
        // What the server stores must not contain the plaintext.
        assert!(!sealed.ciphertext.windows(7).any(|w| w == b"history"));
    }
}

//! Decentralized Identity helpers (forward feature 9.4): W3C DID + VC.
//!
//! Passkey-first, self-sovereign. No cryptocurrency speculation features.

/// A parsed Decentralized Identifier (subset of W3C DID Core syntax).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Did {
    pub method: String,
    pub identifier: String,
}

/// Parse a `did:method:identifier` string.
pub fn parse_did(s: &str) -> Option<Did> {
    let mut parts = s.splitn(3, ':');
    let scheme = parts.next()?;
    if scheme != "did" {
        return None;
    }
    let method = parts.next()?;
    let identifier = parts.next()?;
    if method.is_empty() || identifier.is_empty() {
        return None;
    }
    Some(Did {
        method: method.to_string(),
        identifier: identifier.to_string(),
    })
}

/// A minimal Verifiable Credential presentation check: the holder must match
/// the credential subject and the issuer must be trusted.
pub fn verify_presentation(
    subject: &str,
    holder: &str,
    issuer: &str,
    trusted_issuers: &[&str],
) -> bool {
    subject == holder && trusted_issuers.contains(&issuer)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_did() {
        let d = parse_did("did:web:example.com").unwrap();
        assert_eq!(d.method, "web");
        assert_eq!(d.identifier, "example.com");
    }

    #[test]
    fn rejects_non_did() {
        assert!(parse_did("https://example.com").is_none());
    }

    #[test]
    fn presentation_requires_holder_match_and_trusted_issuer() {
        assert!(verify_presentation(
            "did:web:alice",
            "did:web:alice",
            "did:web:gov",
            &["did:web:gov"]
        ));
        assert!(!verify_presentation(
            "did:web:alice",
            "did:web:bob",
            "did:web:gov",
            &["did:web:gov"]
        ));
    }
}

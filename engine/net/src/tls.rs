//! TLS policy: 1.3 only, certificate handling, downgrade refusal.

/// TLS protocol versions Browser 2030B may encounter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum TlsVersion {
    Tls10,
    Tls11,
    Tls12,
    Tls13,
}

/// Result of validating a server's offered TLS version.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TlsDecision {
    /// Proceed with the handshake.
    Accept,
    /// Refuse: version below the enforced minimum (TLS 1.3).
    RefuseDowngrade,
}

/// Browser 2030B enforces TLS 1.3 as the only acceptable version.
pub const MIN_TLS_VERSION: TlsVersion = TlsVersion::Tls13;

/// Decide whether to accept a server-offered TLS version.
pub fn check_version(offered: TlsVersion) -> TlsDecision {
    if offered >= MIN_TLS_VERSION {
        TlsDecision::Accept
    } else {
        TlsDecision::RefuseDowngrade
    }
}

/// Certificate signature algorithms Browser 2030B accepts.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CertSigAlg {
    Ed25519,
    EcdsaP256,
    RsaPss2048,
    /// Post-quantum ML-DSA-65 (FIPS 204).
    MlDsa65,
}

/// Whether Certificate Transparency proof is required for this connection.
/// Browser 2030B enforces CT for publicly-trusted certificates.
pub fn ct_required(is_publicly_trusted: bool) -> bool {
    is_publicly_trusted
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tls12_is_refused() {
        assert_eq!(
            check_version(TlsVersion::Tls12),
            TlsDecision::RefuseDowngrade
        );
    }

    #[test]
    fn tls13_is_accepted() {
        assert_eq!(check_version(TlsVersion::Tls13), TlsDecision::Accept);
    }

    #[test]
    fn ct_enforced_for_public_certs() {
        assert!(ct_required(true));
        assert!(!ct_required(false));
    }
}

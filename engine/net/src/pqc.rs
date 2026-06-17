//! Post-quantum cryptography negotiation (build brief §3.2, §9.5).
//!
//! Browser 2030B enables the hybrid `X25519MLKEM768` key-exchange group by
//! default (RFC 9794 family / FIPS 203 ML-KEM). This module models the
//! negotiation policy; the actual KEM is provided by the `rustls-pq` feature in
//! production builds.

/// Named TLS key-exchange groups Browser 2030B understands.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KemGroup {
    /// Classical X25519 (RFC 7748).
    X25519,
    /// Pure ML-KEM-768 (FIPS 203).
    MlKem768,
    /// Hybrid X25519 + ML-KEM-768 — the default.
    X25519MlKem768,
}

/// How strictly post-quantum key exchange is required.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PqEnforcement {
    /// Never offer PQ (legacy/testing only).
    Disabled,
    /// Offer PQ-hybrid first, accept classical (the default).
    Preferred,
    /// Require a PQ group; refuse classical-only servers.
    Required,
}

/// Browser 2030B's offered groups, in preference order, given the policy.
pub fn offered_groups(enforcement: PqEnforcement) -> Vec<KemGroup> {
    match enforcement {
        PqEnforcement::Disabled => vec![KemGroup::X25519],
        PqEnforcement::Preferred => {
            vec![
                KemGroup::X25519MlKem768,
                KemGroup::MlKem768,
                KemGroup::X25519,
            ]
        }
        PqEnforcement::Required => vec![KemGroup::X25519MlKem768, KemGroup::MlKem768],
    }
}

/// Whether a `group` is acceptable to complete the handshake under `policy`.
pub fn is_acceptable(group: KemGroup, policy: PqEnforcement) -> bool {
    match policy {
        PqEnforcement::Disabled => true,
        PqEnforcement::Preferred => true,
        PqEnforcement::Required => matches!(group, KemGroup::X25519MlKem768 | KemGroup::MlKem768),
    }
}

/// Select the negotiated group given what the server supports and our policy.
/// Returns `None` if no acceptable group exists (handshake must fail).
pub fn negotiate(server_supported: &[KemGroup], policy: PqEnforcement) -> Option<KemGroup> {
    offered_groups(policy)
        .into_iter()
        .find(|&g| server_supported.contains(&g) && is_acceptable(g, policy))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_offers_hybrid_first() {
        assert_eq!(
            offered_groups(PqEnforcement::Preferred)[0],
            KemGroup::X25519MlKem768
        );
    }

    #[test]
    fn required_refuses_classical_only_server() {
        assert_eq!(
            negotiate(&[KemGroup::X25519], PqEnforcement::Required),
            None
        );
    }

    #[test]
    fn required_accepts_hybrid_server() {
        assert_eq!(
            negotiate(
                &[KemGroup::X25519, KemGroup::X25519MlKem768],
                PqEnforcement::Required
            ),
            Some(KemGroup::X25519MlKem768)
        );
    }

    #[test]
    fn preferred_falls_back_to_classical() {
        assert_eq!(
            negotiate(&[KemGroup::X25519], PqEnforcement::Preferred),
            Some(KemGroup::X25519)
        );
    }
}

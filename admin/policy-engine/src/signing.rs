//! Signed policy bundle verification (build brief §7.1, §7.7).
//!
//! Enterprise bundles are dual-signed: Ed25519 (classical) AND ML-DSA-65
//! (post-quantum, FIPS 204). BOTH must verify before a bundle is accepted. Real
//! builds use `ed25519-dalek` and an ML-DSA implementation behind the `ml-dsa`
//! feature; this module models the dual-signature acceptance gate and is
//! verified by tests with an injectable verifier so the logic is exercised
//! without crypto dependencies.

/// A signature algorithm carried in a bundle.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SigAlg {
    Ed25519,
    MlDsa65,
}

/// One signature over the bundle bytes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BundleSignature {
    pub alg: SigAlg,
    pub key_id: String,
    pub sig: Vec<u8>,
}

/// Outcome of bundle verification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VerifyError {
    /// Missing one of the two required algorithms.
    MissingAlgorithm(SigAlg),
    /// A present signature failed cryptographic verification.
    BadSignature(SigAlg),
}

/// Verify a bundle requires BOTH an Ed25519 and an ML-DSA-65 signature, each of
/// which must pass `verify_one`. The verifier is injected so the acceptance
/// policy is testable independently of the crypto backend.
pub fn verify_bundle<F>(
    _bundle_bytes: &[u8],
    signatures: &[BundleSignature],
    verify_one: F,
) -> Result<(), VerifyError>
where
    F: Fn(&BundleSignature) -> bool,
{
    let has = |alg: SigAlg| signatures.iter().find(|s| s.alg == alg);

    let classical = has(SigAlg::Ed25519).ok_or(VerifyError::MissingAlgorithm(SigAlg::Ed25519))?;
    let pq = has(SigAlg::MlDsa65).ok_or(VerifyError::MissingAlgorithm(SigAlg::MlDsa65))?;

    if !verify_one(classical) {
        return Err(VerifyError::BadSignature(SigAlg::Ed25519));
    }
    if !verify_one(pq) {
        return Err(VerifyError::BadSignature(SigAlg::MlDsa65));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sig(alg: SigAlg) -> BundleSignature {
        BundleSignature {
            alg,
            key_id: "k".into(),
            sig: vec![1, 2, 3],
        }
    }

    #[test]
    fn requires_both_algorithms() {
        let sigs = vec![sig(SigAlg::Ed25519)];
        assert_eq!(
            verify_bundle(b"x", &sigs, |_| true),
            Err(VerifyError::MissingAlgorithm(SigAlg::MlDsa65))
        );
    }

    #[test]
    fn accepts_when_both_valid() {
        let sigs = vec![sig(SigAlg::Ed25519), sig(SigAlg::MlDsa65)];
        assert_eq!(verify_bundle(b"x", &sigs, |_| true), Ok(()));
    }

    #[test]
    fn rejects_when_pq_invalid() {
        let sigs = vec![sig(SigAlg::Ed25519), sig(SigAlg::MlDsa65)];
        let res = verify_bundle(b"x", &sigs, |s| s.alg == SigAlg::Ed25519);
        assert_eq!(res, Err(VerifyError::BadSignature(SigAlg::MlDsa65)));
    }
}

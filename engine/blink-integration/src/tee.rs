//! Confidential Computing Mode: attested-TEE rendering (forward feature §9.12).

/// Supported trusted-execution-environment technologies.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TeeKind {
    IntelTdx,
    AmdSevSnp,
    ArmCca,
}

/// An attestation report from the platform.
#[derive(Debug, Clone)]
pub struct Attestation {
    pub kind: TeeKind,
    /// Measurement of the loaded render enclave image.
    pub measurement: Vec<u8>,
    /// Whether the platform signature over the report verified.
    pub signature_valid: bool,
}

/// Decide whether a render context inside the TEE may be trusted, given the set
/// of measurements the enterprise policy considers good.
pub fn is_trusted(att: &Attestation, allowed_measurements: &[Vec<u8>]) -> bool {
    att.signature_valid && allowed_measurements.iter().any(|m| m == &att.measurement)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn untrusted_when_signature_invalid() {
        let att = Attestation {
            kind: TeeKind::IntelTdx,
            measurement: vec![1, 2, 3],
            signature_valid: false,
        };
        assert!(!is_trusted(&att, &[vec![1, 2, 3]]));
    }

    #[test]
    fn trusted_when_measurement_allowed_and_signed() {
        let att = Attestation {
            kind: TeeKind::AmdSevSnp,
            measurement: vec![9, 9],
            signature_valid: true,
        };
        assert!(is_trusted(&att, &[vec![9, 9]]));
    }

    #[test]
    fn untrusted_when_measurement_unknown() {
        let att = Attestation {
            kind: TeeKind::ArmCca,
            measurement: vec![0],
            signature_valid: true,
        };
        assert!(!is_trusted(&att, &[vec![1]]));
    }
}

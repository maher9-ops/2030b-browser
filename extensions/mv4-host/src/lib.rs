//! # mv4-host
//!
//! The Manifest V4 extension host (build brief §8, `docs/05-extension-ecosystem.md`).
//! Implements MV4 permission semantics, capability-token minting, and the
//! MV2/MV3 → MV4 compatibility shim that translates legacy manifests at install
//! time and surfaces warnings.

/// A manifest version we can ingest.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ManifestVersion {
    V2,
    V3,
    V4,
}

/// A simplified incoming manifest used by the shim.
#[derive(Debug, Clone)]
pub struct IncomingManifest {
    pub version: ManifestVersion,
    pub name: String,
    /// Classic permissions (storage, scripting, ...).
    pub permissions: Vec<String>,
    /// MV2 host permissions / MV3 host_permissions.
    pub host_permissions: Vec<String>,
    /// Whether the extension requested blocking webRequest (MV2 / security ext).
    pub wants_blocking_web_request: bool,
}

/// A warning emitted during MV2/MV3 → MV4 translation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MigrationWarning(pub String);

/// The normalized MV4 manifest produced by the shim.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Mv4Manifest {
    pub name: String,
    pub permissions: Vec<String>,
    /// Host access expressed as a capability-token request (origins, no ambient).
    pub host_capability_origins: Vec<String>,
    /// Blocking webRequest requires explicit admin approval in MV4.
    pub blocking_web_request_requires_admin_approval: bool,
}

/// Translate any incoming manifest to MV4, returning the manifest and warnings.
pub fn to_mv4(m: &IncomingManifest) -> (Mv4Manifest, Vec<MigrationWarning>) {
    let mut warnings = Vec::new();

    if m.version == ManifestVersion::V2 {
        warnings.push(MigrationWarning(
            "MV2 background pages are translated to MV4 service workers".into(),
        ));
    }

    let blocking = m.wants_blocking_web_request;
    if blocking {
        warnings.push(MigrationWarning(
            "blocking webRequest requires explicit admin approval under MV4".into(),
        ));
    }

    if !m.host_permissions.is_empty() && m.version != ManifestVersion::V4 {
        warnings.push(MigrationWarning(
            "host_permissions converted to expiring, origin-bound capability tokens; consider adding an expiry".into(),
        ));
    }

    let manifest = Mv4Manifest {
        name: m.name.clone(),
        permissions: m.permissions.clone(),
        host_capability_origins: m.host_permissions.clone(),
        blocking_web_request_requires_admin_approval: blocking,
    };
    (manifest, warnings)
}

/// MV4 permission categories that default to deny. `did.verify` is the only
/// read-only exception (no privacy impact).
pub fn is_default_deny(permission: &str) -> bool {
    permission != "did.verify"
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mv2(blocking: bool) -> IncomingManifest {
        IncomingManifest {
            version: ManifestVersion::V2,
            name: "Legacy Blocker".into(),
            permissions: vec!["storage".into()],
            host_permissions: vec!["https://*.example.com/*".into()],
            wants_blocking_web_request: blocking,
        }
    }

    #[test]
    fn mv2_blocking_request_requires_admin_approval() {
        let (mv4, warnings) = to_mv4(&mv2(true));
        assert!(mv4.blocking_web_request_requires_admin_approval);
        assert!(warnings.iter().any(|w| w.0.contains("admin approval")));
    }

    #[test]
    fn host_permissions_become_capability_origins() {
        let (mv4, _) = to_mv4(&mv2(false));
        assert_eq!(
            mv4.host_capability_origins,
            vec!["https://*.example.com/*".to_string()]
        );
    }

    #[test]
    fn ai_permissions_default_deny_but_did_verify_allowed() {
        assert!(is_default_deny("ai.remote"));
        assert!(is_default_deny("agent.actuate"));
        assert!(!is_default_deny("did.verify"));
    }
}

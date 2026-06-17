//! # policy-bridge
//!
//! Connects the extension host to the Administrative Configuration Plane's
//! `extensions` policy domain (`admin/schemas/extensions.schema.json`). Before
//! an MV4 manifest is granted, the bridge consults the [`Resolver`] for the
//! effective install mode and allow/block lists, honoring Enterprise >
//! LocalAdmin > User > Default precedence. Default is *deny* unless an explicit
//! allow is resolved.

use mv4_host::Mv4Manifest;
use policy_engine::precedence::Resolver;

/// Keys this bridge reads from the `extensions` policy domain.
pub const KEY_INSTALL_MODE: &str = "extensions.install_mode";
pub const KEY_ALLOWLIST: &str = "extensions.allowlist";
pub const KEY_BLOCKLIST: &str = "extensions.blocklist";

/// The decision returned to the extension host.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum InstallDecision {
    /// Install permitted; the source layer is recorded for provenance.
    Allow { source: String },
    /// Install denied with a human-readable reason.
    Deny { reason: String },
    /// Requires explicit admin approval (e.g. blocking webRequest).
    NeedsAdminApproval { reason: String },
}

fn list_contains(resolver: &Resolver, key: &str, id: &str) -> bool {
    resolver
        .resolve(key)
        .map(|rv| rv.effective.split(',').any(|e| e.trim() == id))
        .unwrap_or(false)
}

/// Decide whether `manifest` (identified by `extension_id`) may install.
pub fn evaluate(
    resolver: &Resolver,
    extension_id: &str,
    manifest: &Mv4Manifest,
) -> InstallDecision {
    // 1. Explicit blocklist always wins.
    if list_contains(resolver, KEY_BLOCKLIST, extension_id) {
        return InstallDecision::Deny {
            reason: format!("{extension_id} is on the admin blocklist"),
        };
    }

    // 2. Blocking webRequest requires admin sign-off regardless of mode.
    if manifest.blocking_web_request_requires_admin_approval {
        return InstallDecision::NeedsAdminApproval {
            reason: "extension requests blocking webRequest".into(),
        };
    }

    // 3. Effective install mode (default-deny when unset).
    let mode = resolver.resolve(KEY_INSTALL_MODE);
    match mode.as_ref().map(|rv| rv.effective.as_str()) {
        Some("allow_all") => InstallDecision::Allow {
            source: mode.expect("present").source.name().to_string(),
        },
        Some("allowlist") => {
            if list_contains(resolver, KEY_ALLOWLIST, extension_id) {
                InstallDecision::Allow {
                    source: mode.expect("present").source.name().to_string(),
                }
            } else {
                InstallDecision::Deny {
                    reason: format!("{extension_id} not on the admin allowlist"),
                }
            }
        }
        Some("block_all") => InstallDecision::Deny {
            reason: "admin policy blocks all extension installs".into(),
        },
        _ => InstallDecision::Deny {
            reason: "no install policy configured (default-deny)".into(),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use policy_engine::precedence::Layer;

    fn manifest(blocking: bool) -> Mv4Manifest {
        Mv4Manifest {
            name: "Test".into(),
            permissions: vec![],
            host_capability_origins: vec![],
            blocking_web_request_requires_admin_approval: blocking,
        }
    }

    #[test]
    fn default_is_deny() {
        let r = Resolver::new();
        assert!(matches!(
            evaluate(&r, "ext1", &manifest(false)),
            InstallDecision::Deny { .. }
        ));
    }

    #[test]
    fn allowlist_mode_gates_by_id() {
        let mut r = Resolver::new();
        r.set(KEY_INSTALL_MODE, Layer::Enterprise, "allowlist", true);
        r.set(KEY_ALLOWLIST, Layer::Enterprise, "good, also-good", true);
        assert!(matches!(
            evaluate(&r, "good", &manifest(false)),
            InstallDecision::Allow { .. }
        ));
        assert!(matches!(
            evaluate(&r, "bad", &manifest(false)),
            InstallDecision::Deny { .. }
        ));
    }

    #[test]
    fn blocklist_overrides_allow_all() {
        let mut r = Resolver::new();
        r.set(KEY_INSTALL_MODE, Layer::LocalAdmin, "allow_all", false);
        r.set(KEY_BLOCKLIST, Layer::Enterprise, "evil", true);
        assert!(matches!(
            evaluate(&r, "evil", &manifest(false)),
            InstallDecision::Deny { .. }
        ));
        assert!(matches!(
            evaluate(&r, "fine", &manifest(false)),
            InstallDecision::Allow { .. }
        ));
    }

    #[test]
    fn blocking_web_request_needs_approval() {
        let mut r = Resolver::new();
        r.set(KEY_INSTALL_MODE, Layer::Enterprise, "allow_all", true);
        assert!(matches!(
            evaluate(&r, "dlp", &manifest(true)),
            InstallDecision::NeedsAdminApproval { .. }
        ));
    }
}

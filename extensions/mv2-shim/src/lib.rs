//! # mv2-shim
//!
//! Parses a (simplified) legacy Manifest V2 document into the
//! [`IncomingManifest`] consumed by the MV4 host. MV2 is the most permissive
//! historical format (persistent background pages, blocking webRequest, broad
//! host permissions), so the shim is deliberately conservative: anything it is
//! unsure about is surfaced as a capability request the MV4 host must gate.

use mv4_host::{IncomingManifest, ManifestVersion};

/// Minimal subset of an MV2 manifest we understand.
#[derive(Debug, Clone, Default)]
pub struct Mv2Document {
    pub name: String,
    pub permissions: Vec<String>,
    /// MV2 mixes host match patterns into `permissions`; we split them out.
    pub background_persistent: bool,
}

/// MV2 entries that are actually host match patterns rather than API perms.
fn is_host_pattern(p: &str) -> bool {
    p.starts_with("http://")
        || p.starts_with("https://")
        || p.starts_with("*://")
        || p == "<all_urls>"
}

/// Translate a parsed MV2 document into an [`IncomingManifest`].
pub fn parse(doc: &Mv2Document) -> IncomingManifest {
    let mut permissions = Vec::new();
    let mut host_permissions = Vec::new();
    let mut wants_blocking_web_request = false;

    for p in &doc.permissions {
        if is_host_pattern(p) {
            host_permissions.push(p.clone());
        } else if p == "webRequestBlocking" {
            wants_blocking_web_request = true;
        } else {
            permissions.push(p.clone());
        }
    }

    IncomingManifest {
        version: ManifestVersion::V2,
        name: doc.name.clone(),
        permissions,
        host_permissions,
        wants_blocking_web_request,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mv4_host::to_mv4;

    #[test]
    fn splits_host_patterns_and_detects_blocking() {
        let doc = Mv2Document {
            name: "Adblock Classic".into(),
            permissions: vec![
                "storage".into(),
                "webRequest".into(),
                "webRequestBlocking".into(),
                "https://*.example.com/*".into(),
                "<all_urls>".into(),
            ],
            background_persistent: true,
        };
        let incoming = parse(&doc);
        assert_eq!(incoming.version, ManifestVersion::V2);
        assert!(incoming.wants_blocking_web_request);
        assert_eq!(incoming.permissions, vec!["storage", "webRequest"]);
        assert_eq!(
            incoming.host_permissions,
            vec!["https://*.example.com/*", "<all_urls>"]
        );

        // End-to-end: the MV4 host should flag the blocking request for admin approval.
        let (mv4, warnings) = to_mv4(&incoming);
        assert!(mv4.blocking_web_request_requires_admin_approval);
        assert!(!warnings.is_empty());
    }
}

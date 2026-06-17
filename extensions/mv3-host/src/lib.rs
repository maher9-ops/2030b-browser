//! # mv3-host
//!
//! Parses a (simplified) Manifest V3 document into the [`IncomingManifest`]
//! consumed by the MV4 host. MV3 already separates `host_permissions` and uses
//! service workers + declarativeNetRequest, so the mapping is close to 1:1; the
//! main job is recognizing the few MV3 constructs that MV4 tightens further
//! (e.g. `declarativeNetRequestWithHostAccess` still needs origin capabilities).

use mv4_host::{IncomingManifest, ManifestVersion};

/// Minimal subset of an MV3 manifest we understand.
#[derive(Debug, Clone, Default)]
pub struct Mv3Document {
    pub name: String,
    pub permissions: Vec<String>,
    pub host_permissions: Vec<String>,
    /// MV3 has no blocking webRequest for normal extensions; only force-installed
    /// enterprise extensions may request it.
    pub force_installed_blocking: bool,
}

/// Translate a parsed MV3 document into an [`IncomingManifest`].
pub fn parse(doc: &Mv3Document) -> IncomingManifest {
    IncomingManifest {
        version: ManifestVersion::V3,
        name: doc.name.clone(),
        permissions: doc.permissions.clone(),
        host_permissions: doc.host_permissions.clone(),
        wants_blocking_web_request: doc.force_installed_blocking,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mv4_host::to_mv4;

    #[test]
    fn maps_mv3_cleanly_to_mv4() {
        let doc = Mv3Document {
            name: "Modern Helper".into(),
            permissions: vec!["storage".into(), "scripting".into()],
            host_permissions: vec!["https://*.example.org/*".into()],
            force_installed_blocking: false,
        };
        let incoming = parse(&doc);
        let (mv4, _warnings) = to_mv4(&incoming);
        assert_eq!(mv4.name, "Modern Helper");
        assert_eq!(
            mv4.host_capability_origins,
            vec!["https://*.example.org/*".to_string()]
        );
        assert!(!mv4.blocking_web_request_requires_admin_approval);
    }

    #[test]
    fn enterprise_blocking_is_flagged() {
        let doc = Mv3Document {
            name: "Enterprise DLP".into(),
            permissions: vec!["webRequest".into()],
            host_permissions: vec!["<all_urls>".into()],
            force_installed_blocking: true,
        };
        let (mv4, _) = to_mv4(&parse(&doc));
        assert!(mv4.blocking_web_request_requires_admin_approval);
    }
}

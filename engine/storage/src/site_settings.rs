//! Per-site settings (Chrome §5.31, §5.32): persistent zoom and the full
//! permission matrix.

use std::collections::HashMap;

/// The set of per-site permissions Browser 2030B tracks. Default-deny.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Permission {
    Cookies,
    Javascript,
    Images,
    Popups,
    Sound,
    Location,
    Camera,
    Microphone,
    Sensors,
    PaymentHandler,
    Usb,
    Serial,
    Hid,
    Midi,
    ArVr,
    Clipboard,
    IdleDetection,
    AutomaticDownloads,
    ProtocolHandlers,
}

/// A permission state, including the "ask once" semantics (Chrome §5.33).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PermissionState {
    /// Explicitly allowed (persisted).
    Allow,
    /// Explicitly denied.
    Block,
    /// Allowed for this session/one use only.
    OneTime,
    /// Not yet decided — defaults to deny at the gate.
    Ask,
}

/// Per-site settings for a single origin.
#[derive(Debug, Clone)]
pub struct SiteSettings {
    /// Persistent zoom level (1.0 == 100%).
    pub zoom: f32,
    perms: HashMap<Permission, PermissionState>,
}

impl Default for SiteSettings {
    fn default() -> Self {
        SiteSettings {
            zoom: 1.0,
            perms: HashMap::new(),
        }
    }
}

impl SiteSettings {
    /// Effective permission state. Unset permissions are `Ask` (deny at gate).
    pub fn permission(&self, p: Permission) -> PermissionState {
        *self.perms.get(&p).unwrap_or(&PermissionState::Ask)
    }

    /// Set a permission state for this site.
    pub fn set(&mut self, p: Permission, state: PermissionState) {
        self.perms.insert(p, state);
    }

    /// Whether an access attempt is granted right now. `Ask` and `Block` deny;
    /// `OneTime` grants but is meant to be cleared after use by the caller.
    pub fn is_granted(&self, p: Permission) -> bool {
        matches!(
            self.permission(p),
            PermissionState::Allow | PermissionState::OneTime
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permissions_default_deny() {
        let s = SiteSettings::default();
        assert!(!s.is_granted(Permission::Camera));
        assert_eq!(s.permission(Permission::Camera), PermissionState::Ask);
    }

    #[test]
    fn allow_grants_access() {
        let mut s = SiteSettings::default();
        s.set(Permission::Location, PermissionState::Allow);
        assert!(s.is_granted(Permission::Location));
    }

    #[test]
    fn block_denies_access() {
        let mut s = SiteSettings::default();
        s.set(Permission::Microphone, PermissionState::Block);
        assert!(!s.is_granted(Permission::Microphone));
    }
}

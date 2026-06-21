//! Strict precedence resolution: Enterprise > Local Admin > User > Default
//! (build brief §7.2). Every effective value is queryable with full provenance.

use std::collections::HashMap;

/// The four configuration layers, ordered by increasing precedence.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Layer {
    Default = 0,
    User = 1,
    LocalAdmin = 2,
    Enterprise = 3,
}

impl Layer {
    pub fn name(self) -> &'static str {
        match self {
            Layer::Default => "default",
            Layer::User => "user",
            Layer::LocalAdmin => "local_admin",
            Layer::Enterprise => "enterprise",
        }
    }
}

/// A value set at a particular layer, optionally locked (preventing lower
/// layers from being considered even if higher ones are absent).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LayerValue {
    pub layer: Layer,
    pub value: String,
    /// If true, this value is locked: lower-precedence layers cannot override
    /// and the UI shows the control as managed.
    pub locked: bool,
}

/// The resolved effective value plus its full provenance trace.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedValue {
    pub key: String,
    pub effective: String,
    pub source: Layer,
    pub locked: bool,
    /// All contributing layer values, lowest to highest precedence.
    pub trace: Vec<LayerValue>,
}

/// Resolves keys across layers with strict precedence.
#[derive(Debug, Default)]
pub struct Resolver {
    /// key -> values from each layer that set it.
    values: HashMap<String, Vec<LayerValue>>,
}

impl Resolver {
    pub fn new() -> Self {
        Resolver {
            values: HashMap::new(),
        }
    }

    /// Set a value for `key` at `layer`.
    pub fn set(&mut self, key: &str, layer: Layer, value: &str, locked: bool) {
        let entry = self.values.entry(key.to_string()).or_default();
        // Replace any existing value for the same layer.
        entry.retain(|lv| lv.layer != layer);
        entry.push(LayerValue {
            layer,
            value: value.to_string(),
            locked,
        });
        entry.sort_by_key(|lv| lv.layer);
    }

    /// Resolve the effective value for `key`. The highest-precedence layer wins.
    /// A `locked` flag from the winning layer is propagated. Returns `None` if
    /// the key is unset at every layer.
    pub fn resolve(&self, key: &str) -> Option<ResolvedValue> {
        let trace = self.values.get(key)?.clone();
        if trace.is_empty() {
            return None;
        }
        // Highest layer is last because trace is sorted ascending.
        let winner = trace.last().expect("non-empty checked above").clone();
        Some(ResolvedValue {
            key: key.to_string(),
            effective: winner.value,
            source: winner.layer,
            locked: winner.locked,
            trace,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn enterprise_overrides_user_and_default() {
        let mut r = Resolver::new();
        r.set(
            "network.doh.provider",
            Layer::Default,
            "https://default.example",
            false,
        );
        r.set(
            "network.doh.provider",
            Layer::User,
            "https://dns.google",
            false,
        );
        r.set(
            "network.doh.provider",
            Layer::Enterprise,
            "https://dns.quad9.net",
            true,
        );

        let resolved = r.resolve("network.doh.provider").unwrap();
        assert_eq!(resolved.effective, "https://dns.quad9.net");
        assert_eq!(resolved.source, Layer::Enterprise);
        assert!(resolved.locked);
        assert_eq!(resolved.trace.len(), 3);
        // Trace is ordered lowest -> highest precedence.
        assert_eq!(resolved.trace[0].layer, Layer::Default);
        assert_eq!(resolved.trace[2].layer, Layer::Enterprise);
    }

    #[test]
    fn user_wins_when_no_higher_layer() {
        let mut r = Resolver::new();
        r.set("ui.theme", Layer::Default, "auto", false);
        r.set("ui.theme", Layer::User, "dark", false);
        let resolved = r.resolve("ui.theme").unwrap();
        assert_eq!(resolved.effective, "dark");
        assert_eq!(resolved.source, Layer::User);
        assert!(!resolved.locked);
    }

    #[test]
    fn unset_key_resolves_none() {
        let r = Resolver::new();
        assert!(r.resolve("does.not.exist").is_none());
    }

    #[test]
    fn local_admin_between_user_and_enterprise() {
        let mut r = Resolver::new();
        r.set("k", Layer::User, "u", false);
        r.set("k", Layer::LocalAdmin, "la", false);
        assert_eq!(r.resolve("k").unwrap().source, Layer::LocalAdmin);
    }
}

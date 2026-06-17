//! # v8-bindings
//!
//! Rust bindings to the V8 JavaScript engine vendored from Chromium. Real
//! builds link against `libv8` via FFI (see `engine/blink-integration/build.rs`
//! once Chromium is fetched by `./bootstrap`). This crate exposes the safe Rust
//! surface — realm management, the V8 sandbox toggle, and per-origin JIT policy.

/// Per-origin JavaScript execution policy (build brief §3.1).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct JsPolicy {
    /// V8 sandbox (pointer-compression cage) enabled.
    pub v8_sandbox: bool,
    /// JIT-less interpreter-only mode (mitigates JIT exploit surface).
    pub jitless: bool,
}

impl Default for JsPolicy {
    fn default() -> Self {
        // Secure defaults: sandbox on, JIT enabled (perf), togglable per origin.
        JsPolicy {
            v8_sandbox: true,
            jitless: false,
        }
    }
}

/// A V8 realm (isolate + context) created for a given origin.
#[derive(Debug)]
pub struct JsRealm {
    pub origin: String,
    pub policy: JsPolicy,
}

impl JsRealm {
    /// Create a realm. In production this allocates a V8 isolate configured per
    /// `policy`; here it records the intended configuration.
    pub fn new(origin: &str, policy: JsPolicy) -> Self {
        JsRealm {
            origin: origin.to_string(),
            policy,
        }
    }

    /// Whether JIT compilation is permitted in this realm.
    pub fn jit_enabled(&self) -> bool {
        !self.policy.jitless
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jitless_realm_disables_jit() {
        let realm = JsRealm::new(
            "https://sensitive.example",
            JsPolicy {
                v8_sandbox: true,
                jitless: true,
            },
        );
        assert!(!realm.jit_enabled());
        assert!(realm.policy.v8_sandbox);
    }
}

//! # spidermonkey-bindings
//!
//! Rust bindings to the SpiderMonkey JavaScript engine vendored from Gecko.
//! Available via admin policy for security-sensitive origins (build brief
//! §3.1). Real builds link against `libmozjs` via FFI once Gecko is fetched by
//! `./bootstrap`.

/// Identifies which JS engine an origin should use.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JsEngine {
    /// V8 (default, primary).
    V8,
    /// SpiderMonkey (secondary, policy-selected for sensitive origins).
    SpiderMonkey,
}

/// Choose the JS engine for an origin given a policy allowlist of origins that
/// must run on SpiderMonkey.
pub fn select_engine(origin: &str, spidermonkey_origins: &[&str]) -> JsEngine {
    if spidermonkey_origins.contains(&origin) {
        JsEngine::SpiderMonkey
    } else {
        JsEngine::V8
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn policy_routes_origin_to_spidermonkey() {
        let allow = ["https://bank.example"];
        assert_eq!(
            select_engine("https://bank.example", &allow),
            JsEngine::SpiderMonkey
        );
        assert_eq!(select_engine("https://other.example", &allow), JsEngine::V8);
    }
}

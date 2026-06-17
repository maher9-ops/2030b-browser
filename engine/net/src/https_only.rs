//! HTTPS-Only and HTTPS-First mode logic (Firefox parity §6.22).

/// HTTPS upgrade behavior.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HttpsMode {
    /// Never allow plaintext HTTP; fail closed.
    HttpsOnly,
    /// Try HTTPS first, fall back to HTTP with a warning if it fails.
    HttpsFirst,
    /// No automatic upgrade (not recommended; selectable only by policy).
    Off,
}

/// The decision for a given navigation URL.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UpgradeDecision {
    /// Use the URL as-is (already https or upgraded).
    Proceed(String),
    /// Upgrade the scheme to https and proceed.
    Upgraded(String),
    /// Block the navigation entirely (HttpsOnly + non-https + no upgrade path).
    Blocked,
    /// Allow plaintext but surface a warning (HttpsFirst fallback).
    PlaintextWithWarning(String),
}

/// Apply the HTTPS mode to a navigation URL.
///
/// `https_known_failing` models a prior probe that learned the host does not
/// serve HTTPS (used by HttpsFirst to decide fallback).
pub fn decide(url: &str, mode: HttpsMode, https_known_failing: bool) -> UpgradeDecision {
    let is_https = url.starts_with("https://");
    let is_http = url.starts_with("http://");

    if is_https {
        return UpgradeDecision::Proceed(url.to_string());
    }
    if !is_http {
        // Non-http(s) scheme (e.g. about:, ipfs:) is not our concern here.
        return UpgradeDecision::Proceed(url.to_string());
    }

    let upgraded = format!("https://{}", &url["http://".len()..]);
    match mode {
        HttpsMode::HttpsOnly => UpgradeDecision::Upgraded(upgraded),
        HttpsMode::HttpsFirst => {
            if https_known_failing {
                UpgradeDecision::PlaintextWithWarning(url.to_string())
            } else {
                UpgradeDecision::Upgraded(upgraded)
            }
        }
        HttpsMode::Off => UpgradeDecision::Proceed(url.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn https_only_upgrades_http() {
        assert_eq!(
            decide("http://example.com/x", HttpsMode::HttpsOnly, false),
            UpgradeDecision::Upgraded("https://example.com/x".into())
        );
    }

    #[test]
    fn https_only_passes_https_through() {
        assert_eq!(
            decide("https://example.com/x", HttpsMode::HttpsOnly, false),
            UpgradeDecision::Proceed("https://example.com/x".into())
        );
    }

    #[test]
    fn https_first_falls_back_with_warning() {
        assert_eq!(
            decide("http://legacy.example/x", HttpsMode::HttpsFirst, true),
            UpgradeDecision::PlaintextWithWarning("http://legacy.example/x".into())
        );
    }

    #[test]
    fn https_first_upgrades_when_unknown() {
        assert_eq!(
            decide("http://example.com", HttpsMode::HttpsFirst, false),
            UpgradeDecision::Upgraded("https://example.com".into())
        );
    }
}

//! Fission: per-site content isolation for Gecko-rendered origins (§6.17).
//!
//! Under Fission, even cross-origin iframes embedded in a page get their own
//! content process keyed by their site principal, so a compromise of one
//! origin's renderer cannot read another's memory.

use std::collections::HashMap;

/// Derive the site principal (scheme + registrable domain) for isolation.
pub fn principal_for(origin: &str) -> String {
    // Reuse the same simplified eTLD+1 derivation as Blink site isolation.
    let scheme_end = origin.find("://").map(|i| i + 3).unwrap_or(0);
    let rest = &origin[scheme_end..];
    let host = rest.split(['/', ':']).next().unwrap_or(rest);
    let labels: Vec<&str> = host.split('.').collect();
    let reg = if labels.len() >= 2 {
        labels[labels.len() - 2..].join(".")
    } else {
        host.to_string()
    };
    let scheme = if scheme_end > 0 {
        &origin[..scheme_end - 3]
    } else {
        "https"
    };
    format!("{scheme}://{reg}")
}

/// Maps site principals to dedicated Gecko content processes.
#[derive(Debug, Default)]
pub struct FissionMap {
    by_principal: HashMap<String, u32>,
    next_pid: u32,
}

impl FissionMap {
    pub fn new() -> Self {
        FissionMap {
            by_principal: HashMap::new(),
            next_pid: 2000,
        }
    }

    /// Return the content-process pid for an embedded frame's origin, isolating
    /// distinct principals into distinct processes.
    pub fn process_for_frame(&mut self, frame_origin: &str) -> u32 {
        let principal = principal_for(frame_origin);
        if let Some(pid) = self.by_principal.get(&principal) {
            return *pid;
        }
        self.next_pid += 1;
        let pid = self.next_pid;
        self.by_principal.insert(principal, pid);
        pid
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cross_origin_iframe_is_isolated() {
        let mut m = FissionMap::new();
        let top = m.process_for_frame("https://news.example/");
        let ad = m.process_for_frame("https://ads.test/banner");
        assert_ne!(top, ad);
    }

    #[test]
    fn same_principal_subframes_share() {
        let mut m = FissionMap::new();
        let a = m.process_for_frame("https://a.cdn.example/1");
        let b = m.process_for_frame("https://b.cdn.example/2");
        assert_eq!(a, b);
    }
}

//! Strict site isolation: one renderer process per site (Chrome §5.9).

use std::collections::HashMap;

/// Extract the site (scheme + eTLD+1) used as the isolation key.
///
/// This is a simplified eTLD+1 derivation sufficient for the isolation map;
/// production uses the Public Suffix List.
pub fn site_for_url(url: &str) -> String {
    let scheme_end = url.find("://").map(|i| i + 3).unwrap_or(0);
    let rest = &url[scheme_end..];
    let host = rest.split(['/', ':', '?', '#']).next().unwrap_or(rest);
    let labels: Vec<&str> = host.split('.').collect();
    let etld1 = if labels.len() >= 2 {
        labels[labels.len() - 2..].join(".")
    } else {
        host.to_string()
    };
    let scheme = if scheme_end > 0 {
        &url[..scheme_end - 3]
    } else {
        "https"
    };
    format!("{scheme}://{etld1}")
}

/// Maps sites to their dedicated renderer process.
#[derive(Debug, Default)]
pub struct IsolationMap {
    sites: HashMap<String, u32>,
    next_pid: u32,
}

impl IsolationMap {
    pub fn new() -> Self {
        IsolationMap {
            sites: HashMap::new(),
            next_pid: 1000,
        }
    }

    /// Return the renderer pid for the site of `url`, allocating one if needed.
    /// Two URLs of the same site share a process; different sites never do.
    pub fn process_for(&mut self, url: &str) -> u32 {
        let site = site_for_url(url);
        if let Some(pid) = self.sites.get(&site) {
            return *pid;
        }
        self.next_pid += 1;
        let pid = self.next_pid;
        self.sites.insert(site, pid);
        pid
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_site_shares_process() {
        let mut m = IsolationMap::new();
        let a = m.process_for("https://example.com/a");
        let b = m.process_for("https://www.example.com/b");
        assert_eq!(a, b);
    }

    #[test]
    fn different_site_isolated() {
        let mut m = IsolationMap::new();
        let a = m.process_for("https://example.com/");
        let b = m.process_for("https://evil.test/");
        assert_ne!(a, b);
    }

    #[test]
    fn scheme_is_part_of_site() {
        assert_eq!(
            site_for_url("https://a.example.com/x"),
            "https://example.com"
        );
    }
}

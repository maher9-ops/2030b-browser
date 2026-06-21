//! Per-origin renderer selection: Blink (default) or Gecko (policy/heuristic).

/// Which rendering engine handles an origin.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Renderer {
    Blink,
    Gecko,
}

/// Selection inputs from the policy engine and compatibility heuristic.
#[derive(Debug, Clone)]
pub struct SelectionContext<'a> {
    /// Origins the admin policy pins to Gecko.
    pub gecko_policy_origins: &'a [&'a str],
    /// Whether the compatibility heuristic flagged this origin as Gecko-better.
    pub heuristic_prefers_gecko: bool,
}

/// Choose the renderer for an origin. Policy wins over heuristic; Blink default.
pub fn select(origin: &str, ctx: &SelectionContext) -> Renderer {
    if ctx.gecko_policy_origins.contains(&origin) {
        return Renderer::Gecko;
    }
    if ctx.heuristic_prefers_gecko {
        return Renderer::Gecko;
    }
    Renderer::Blink
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_blink() {
        let ctx = SelectionContext {
            gecko_policy_origins: &[],
            heuristic_prefers_gecko: false,
        };
        assert_eq!(select("https://example.com", &ctx), Renderer::Blink);
    }

    #[test]
    fn policy_pins_to_gecko() {
        let ctx = SelectionContext {
            gecko_policy_origins: &["https://legacy.example"],
            heuristic_prefers_gecko: false,
        };
        assert_eq!(select("https://legacy.example", &ctx), Renderer::Gecko);
    }
}

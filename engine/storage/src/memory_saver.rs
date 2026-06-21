//! Tab freezing / discarding and the memory saver (Chrome §5.5).

/// The lifecycle state of a background tab.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TabState {
    /// Foreground or recently used; never throttled.
    Active,
    /// Backgrounded; timers throttled (intensive throttling).
    Frozen,
    /// Unloaded from memory; will be reloaded on focus.
    Discarded,
}

/// Inputs to the memory-saver decision.
#[derive(Debug, Clone, Copy)]
pub struct TabSignals {
    pub is_foreground: bool,
    pub seconds_since_active: u64,
    pub is_audible: bool,
    pub is_pinned: bool,
    pub uses_camera_or_mic: bool,
}

/// Memory-saver thresholds (configurable by policy/energy mode).
#[derive(Debug, Clone, Copy)]
pub struct SaverConfig {
    pub freeze_after_secs: u64,
    pub discard_after_secs: u64,
}

impl Default for SaverConfig {
    fn default() -> Self {
        SaverConfig {
            freeze_after_secs: 300,   // 5 min
            discard_after_secs: 1800, // 30 min
        }
    }
}

/// Decide the lifecycle state for a tab. Audible, pinned, and capture-using
/// tabs are never frozen or discarded.
pub fn decide(signals: TabSignals, cfg: SaverConfig) -> TabState {
    if signals.is_foreground
        || signals.is_audible
        || signals.is_pinned
        || signals.uses_camera_or_mic
    {
        return TabState::Active;
    }
    if signals.seconds_since_active >= cfg.discard_after_secs {
        TabState::Discarded
    } else if signals.seconds_since_active >= cfg.freeze_after_secs {
        TabState::Frozen
    } else {
        TabState::Active
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bg(secs: u64) -> TabSignals {
        TabSignals {
            is_foreground: false,
            seconds_since_active: secs,
            is_audible: false,
            is_pinned: false,
            uses_camera_or_mic: false,
        }
    }

    #[test]
    fn freezes_then_discards() {
        let cfg = SaverConfig::default();
        assert_eq!(decide(bg(10), cfg), TabState::Active);
        assert_eq!(decide(bg(400), cfg), TabState::Frozen);
        assert_eq!(decide(bg(2000), cfg), TabState::Discarded);
    }

    #[test]
    fn audible_tab_never_frozen() {
        let mut s = bg(5000);
        s.is_audible = true;
        assert_eq!(decide(s, SaverConfig::default()), TabState::Active);
    }

    #[test]
    fn capture_tab_never_discarded() {
        let mut s = bg(5000);
        s.uses_camera_or_mic = true;
        assert_eq!(decide(s, SaverConfig::default()), TabState::Active);
    }
}

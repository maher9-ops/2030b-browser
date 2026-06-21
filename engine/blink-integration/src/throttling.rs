//! Background tab throttling / intensive throttling (Chrome §5.35).

/// Throttling tier applied to a background tab's timers.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThrottleTier {
    /// Foreground: no throttling.
    None,
    /// Backgrounded < 5 min: timers aligned to 1s.
    Background,
    /// Backgrounded >= 5 min: timers aligned to 1 min (intensive throttling).
    Intensive,
}

/// Minimum timer interval (ms) imposed by a tier.
pub fn min_timer_interval_ms(tier: ThrottleTier) -> u64 {
    match tier {
        ThrottleTier::None => 4,
        ThrottleTier::Background => 1_000,
        ThrottleTier::Intensive => 60_000,
    }
}

/// Decide the throttle tier for a tab.
pub fn tier(is_foreground: bool, seconds_in_background: u64) -> ThrottleTier {
    if is_foreground {
        ThrottleTier::None
    } else if seconds_in_background >= 300 {
        ThrottleTier::Intensive
    } else {
        ThrottleTier::Background
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn intensive_after_five_minutes() {
        assert_eq!(tier(false, 301), ThrottleTier::Intensive);
        assert_eq!(min_timer_interval_ms(ThrottleTier::Intensive), 60_000);
    }

    #[test]
    fn foreground_never_throttled() {
        assert_eq!(tier(true, 99999), ThrottleTier::None);
    }
}

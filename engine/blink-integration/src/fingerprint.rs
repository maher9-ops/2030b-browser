//! Fingerprint randomization and the per-origin privacy budget
//! (privacy domain §7.3.3, forward feature §9.11).

/// Randomization strength for fingerprinting-prone surfaces.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RandomizationLevel {
    Off,
    Standard,
    Strict,
    Maximum,
}

/// A per-origin privacy budget. High-entropy API calls debit the budget; once
/// exhausted, APIs return coarsened/noised values.
#[derive(Debug, Clone)]
pub struct PrivacyBudget {
    pub origin: String,
    remaining: f64,
    level: RandomizationLevel,
}

impl PrivacyBudget {
    /// Initial budget depends on the randomization level (stricter = smaller).
    pub fn new(origin: &str, level: RandomizationLevel) -> Self {
        let remaining = match level {
            RandomizationLevel::Off => f64::INFINITY,
            RandomizationLevel::Standard => 10.0,
            RandomizationLevel::Strict => 4.0,
            RandomizationLevel::Maximum => 1.0,
        };
        PrivacyBudget {
            origin: origin.to_string(),
            remaining,
            level,
        }
    }

    /// Attempt to spend `cost` entropy. Returns true if the access is allowed at
    /// full fidelity; false means the caller must return a noised value.
    pub fn try_spend(&mut self, cost: f64) -> bool {
        if self.level == RandomizationLevel::Off {
            return true;
        }
        if self.remaining >= cost {
            self.remaining -= cost;
            true
        } else {
            false
        }
    }

    pub fn remaining(&self) -> f64 {
        self.remaining
    }
}

/// Apply deterministic per-origin canvas noise. The same origin gets a stable
/// perturbation (so the site sees a consistent fake), different origins differ.
pub fn canvas_noise_seed(origin: &str, level: RandomizationLevel) -> u64 {
    if level == RandomizationLevel::Off {
        return 0;
    }
    let mut h: u64 = 1469598103934665603;
    for b in origin.bytes() {
        h ^= b as u64;
        h = h.wrapping_mul(1099511628211);
    }
    h
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn budget_exhausts() {
        let mut b = PrivacyBudget::new("https://x.example", RandomizationLevel::Maximum);
        assert!(b.try_spend(1.0));
        assert!(!b.try_spend(0.5));
    }

    #[test]
    fn off_level_never_limits() {
        let mut b = PrivacyBudget::new("https://x.example", RandomizationLevel::Off);
        assert!(b.try_spend(1e9));
    }

    #[test]
    fn noise_seed_is_per_origin_stable() {
        let a1 = canvas_noise_seed("https://a.example", RandomizationLevel::Standard);
        let a2 = canvas_noise_seed("https://a.example", RandomizationLevel::Standard);
        let b = canvas_noise_seed("https://b.example", RandomizationLevel::Standard);
        assert_eq!(a1, a2);
        assert_ne!(a1, b);
    }
}

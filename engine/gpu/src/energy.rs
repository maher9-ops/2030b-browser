//! Per-tab energy and CO2 estimation (forward feature §9.8).

/// Per-tab activity sample used to estimate energy draw.
#[derive(Debug, Clone, Copy)]
pub struct ActivitySample {
    /// CPU time consumed by the tab's processes in this window (ms).
    pub cpu_ms: f64,
    /// GPU time consumed in this window (ms).
    pub gpu_ms: f64,
    /// Whether hardware-accelerated video decode was active.
    pub hw_video: bool,
    /// Sampling window length (seconds).
    pub window_secs: f64,
}

/// Coefficients (watts per unit) — calibrated per device class in production.
#[derive(Debug, Clone, Copy)]
pub struct PowerModel {
    pub watts_per_cpu_ratio: f64,
    pub watts_per_gpu_ratio: f64,
    /// Grid carbon intensity in grams CO2 per watt-hour.
    pub grid_g_co2_per_wh: f64,
}

impl Default for PowerModel {
    fn default() -> Self {
        // Reasonable mobile-class defaults; grid ~ EU average.
        PowerModel {
            watts_per_cpu_ratio: 15.0,
            watts_per_gpu_ratio: 8.0,
            grid_g_co2_per_wh: 0.30,
        }
    }
}

/// Estimated energy use for a sampling window.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EnergyEstimate {
    pub average_watts: f64,
    pub energy_wh: f64,
    pub co2_grams: f64,
}

/// Estimate energy and CO2 for one activity sample.
pub fn estimate(sample: ActivitySample, model: PowerModel) -> EnergyEstimate {
    let cpu_ratio = (sample.cpu_ms / (sample.window_secs * 1000.0)).clamp(0.0, 1.0);
    let gpu_ratio = (sample.gpu_ms / (sample.window_secs * 1000.0)).clamp(0.0, 1.0);
    let mut watts = cpu_ratio * model.watts_per_cpu_ratio + gpu_ratio * model.watts_per_gpu_ratio;
    // Hardware video decode is far more efficient than software; green mode
    // prefers it, so reward it with a small efficiency credit.
    if sample.hw_video {
        watts *= 0.85;
    }
    let energy_wh = watts * (sample.window_secs / 3600.0);
    EnergyEstimate {
        average_watts: watts,
        energy_wh,
        co2_grams: energy_wh * model.grid_g_co2_per_wh,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn idle_tab_uses_little_power() {
        let s = ActivitySample {
            cpu_ms: 5.0,
            gpu_ms: 0.0,
            hw_video: false,
            window_secs: 10.0,
        };
        let e = estimate(s, PowerModel::default());
        assert!(e.average_watts < 0.2);
    }

    #[test]
    fn busy_tab_uses_more_power_and_emits_co2() {
        let s = ActivitySample {
            cpu_ms: 8000.0,
            gpu_ms: 4000.0,
            hw_video: false,
            window_secs: 10.0,
        };
        let e = estimate(s, PowerModel::default());
        assert!(e.average_watts > 5.0);
        assert!(e.co2_grams > 0.0);
    }

    #[test]
    fn hw_video_credit_applies() {
        let base = ActivitySample {
            cpu_ms: 4000.0,
            gpu_ms: 4000.0,
            hw_video: false,
            window_secs: 10.0,
        };
        let hw = ActivitySample {
            hw_video: true,
            ..base
        };
        assert!(
            estimate(hw, PowerModel::default()).average_watts
                < estimate(base, PowerModel::default()).average_watts
        );
    }
}

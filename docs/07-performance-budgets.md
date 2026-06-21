# 07 — Performance Budgets

These are **hard gates**. CI fails the build if any budget is exceeded. Each
budget maps to a measurement harness and a CI job in `ci/workflows/perf.yml`.

## 1. Budgets

| # | Metric | Budget | Harness | CI gate |
|---|--------|--------|---------|---------|
| 1 | Cold start (2025-class laptop, M-class or 28 W x86) | **< 800 ms** | `tests/integration/perf/cold_start.rs` | `perf.cold_start` |
| 2 | New tab open | **< 80 ms** | `tests/integration/perf/new_tab.rs` | `perf.new_tab` |
| 3 | Idle RAM, 10 tabs suspended | **< 250 MB** | `tests/integration/perf/idle_ram.rs` | `perf.idle_ram` |
| 4 | TTI on top-1000 sites (100 Mbps fiber, median) | **< 1.2 s** | `tests/integration/perf/tti.rs` | `perf.tti` |
| 5 | Speedometer 3 vs upstream Chromium stable | **within 5%** | `tests/integration/perf/speedometer.rs` | `perf.speedometer` |
| 6 | Video playback battery vs upstream | **≥ 10% longer** | `tests/integration/perf/battery.rs` | `perf.battery` |

## 2. Measurement Methodology

- **Devices:** a fixed reference matrix (Apple M-series, AMD/Intel 28 W mobile,
  arm64 Linux). Numbers are reported per device class.
- **Cold start:** measured from process exec to first interactive paint of the
  new-tab page, median of 30 runs, machine otherwise idle.
- **New tab:** time from `Ctrl+T` event to interactive new-tab page, median of
  100 runs.
- **Idle RAM:** USS (unique set size) summed across all processes after 60 s
  idle with 10 representative tabs suspended.
- **TTI:** Lighthouse-equivalent Time To Interactive on a pinned snapshot of the
  top-1000 sites served from a local mirror to remove network variance, then
  re-validated on 100 Mbps fiber.
- **Speedometer 3:** official harness; compared against the same week's upstream
  Chromium stable on identical hardware.
- **Battery:** 1080p AV1 loop to battery exhaustion, screen brightness fixed,
  compared against upstream Chromium stable.

## 3. Regression Gates

`tools/lint/perf-gate.py` reads `perf-results.json` produced by the harnesses
and compares against the budgets above plus a **rolling baseline**:

- **Absolute gate:** any metric worse than its budget fails the build.
- **Relative gate:** any metric > 3% worse than the 7-day rolling median for the
  same device class fails the build (catches gradual regressions).

```jsonc
// perf-results.json (schema)
{
  "device_class": "apple-m",
  "metrics": {
    "cold_start_ms": 712,
    "new_tab_ms": 64,
    "idle_ram_mb": 233,
    "tti_top1000_median_ms": 1110,
    "speedometer3_ratio_to_upstream": 0.98,
    "battery_video_ratio_to_upstream": 1.12
  }
}
```

## 4. Budget Ownership

| Budget | Owning module |
|--------|---------------|
| Cold start | `engine/blink-integration/`, `ui/shell-desktop/` |
| New tab | `ui/shell-desktop/src/tabs/` |
| Idle RAM | `engine/storage/src/memory_saver.rs`, `engine/blink-integration/src/throttling.rs` |
| TTI | `engine/net/`, `engine/gpu/` |
| Speedometer 3 | `engine/v8-bindings/` |
| Battery | `engine/gpu/src/energy.rs`, `engine/blink-integration/src/throttling.rs` |

## 5. Continuous Tracking

Every merged PR appends its perf numbers to a time-series store; the Energy &
Carbon dashboard (`docs/04`) reuses the same harness data for the per-tab energy
estimate.

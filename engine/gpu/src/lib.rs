//! # engine-gpu
//!
//! WebRender-equivalent GPU compositor (Firefox §6.30), screen/region/element
//! capture (Chrome §5.24), and per-tab energy estimation feeding the Energy &
//! Carbon dashboard (forward feature §9.8). The GPU device backend is provided
//! by the vendored compositor in production; this crate models the
//! policy/estimation logic over std.

pub mod capture;
pub mod compositor;
pub mod energy;

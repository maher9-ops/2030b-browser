//! # blink-integration
//!
//! Integration shim that drives the vendored Blink renderer. It owns the
//! site-isolation process map, per-origin renderer selection, background
//! throttling, fingerprint randomization, DRM gating, and the confidential
//! computing (TEE) trust check.
//!
//! The renderer itself is C++ vendored from Chromium and fetched by
//! `./bootstrap`. This crate provides the safe Rust API the broker uses.

pub mod fingerprint;
pub mod renderer_selector;
pub mod site_isolation;
pub mod tee;
pub mod throttling;

/// A handle to a renderer process bound to a single site (strict site isolation).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RendererProcess {
    pub pid: u32,
    pub site: String,
}

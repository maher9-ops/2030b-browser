//! # gecko-integration
//!
//! Integration shim that drives the vendored Gecko renderer as a sandboxed
//! process group, selected per-origin by policy. Implements the Fission-style
//! per-site content isolation model (Firefox §6.17). The renderer is C++
//! vendored from Gecko and fetched by `./bootstrap`.

pub mod fission;

/// A handle to a Gecko content process.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeckoContentProcess {
    pub pid: u32,
    /// The principal (origin) this content process is dedicated to.
    pub principal: String,
}

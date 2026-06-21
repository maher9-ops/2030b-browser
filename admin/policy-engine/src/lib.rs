//! # policy-engine
//!
//! The Administrative Configuration Plane (build brief §7). A first-class tier
//! between the UI and the engine. It resolves configuration values across four
//! layers with strict precedence, validates bundles against JSON Schema,
//! evaluates Rego policies (embedded OPA Wasm in production), verifies signed
//! bundles (Ed25519 + ML-DSA-65), and emits provenance for every decision.

pub mod audit;
pub mod precedence;
pub mod provenance;
pub mod signing;

pub use precedence::{Layer, ResolvedValue, Resolver};
pub use provenance::DecisionSpan;
pub use signing::{verify_bundle, BundleSignature};

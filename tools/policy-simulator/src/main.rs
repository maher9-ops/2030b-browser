//! `policy-simulator` — dry-run the Administrative Configuration Plane
//! (build brief §7.4): `b2030b policy simulate --bundle policy.rego --scenario s.json`.
//!
//! It demonstrates layered precedence resolution against a scenario without
//! touching the live policy state. When built with `policy-engine`'s
//! `opa-wasm` feature it can additionally evaluate the Rego bundle.

use policy_engine::precedence::{Layer, Resolver};
use policy_engine::provenance::DecisionSpan;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let bundle = arg(&args, "--bundle");
    let scenario = arg(&args, "--scenario");

    println!("b2030b policy simulate");
    println!("  bundle   = {}", bundle.as_deref().unwrap_or("<none>"));
    println!("  scenario = {}", scenario.as_deref().unwrap_or("<none>"));
    println!();

    // Demonstration scenario: resolve a network DoH provider across layers and
    // show the resulting provenance span exactly as the live engine would emit.
    let mut r = Resolver::new();
    r.set(
        "network.doh.provider",
        Layer::Default,
        "https://b2030b.example/dns-query",
        false,
    );
    r.set(
        "network.doh.provider",
        Layer::User,
        "https://dns.google/dns-query",
        false,
    );
    r.set(
        "network.doh.provider",
        Layer::Enterprise,
        "https://dns.quad9.net/dns-query",
        true,
    );

    let resolved = r.resolve("network.doh.provider").expect("key is set");
    println!(
        "Effective: {} (source={}, locked={})",
        resolved.effective,
        resolved.source.name(),
        resolved.locked
    );

    let span = DecisionSpan::new(
        "network",
        "doh.provider",
        &resolved.effective,
        "enterprise_doh",
        resolved.source,
    )
    .with_input("data_residency", "eu");
    println!("Provenance span: {}", span.to_log_line());
}

fn arg(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|a| a == flag)
        .and_then(|i| args.get(i + 1).cloned())
}

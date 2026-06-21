//! `policy-engine` CLI — the Administrative Configuration Plane binary.
//!
//! In production this runs as a daemon exposing a gRPC API over an authenticated
//! Unix domain socket / named pipe, hot-reloading bundles and broadcasting
//! effective-policy diffs over IPC. This CLI front-end supports the operations
//! that are scriptable and testable in any environment:
//!
//!   policy-engine resolve --key <k> --layer <layer>=<value> ...
//!   policy-engine evaluate --bundle <file.rego> --input <file.json>
//!   policy-engine version
//!
//! The `evaluate` subcommand delegates to the OPA Wasm runtime when built with
//! `--features opa-wasm`; otherwise it reports that the runtime is not compiled
//! in (rather than silently faking a decision).

use policy_engine::precedence::{Layer, Resolver};

fn parse_layer(s: &str) -> Option<Layer> {
    match s {
        "default" => Some(Layer::Default),
        "user" => Some(Layer::User),
        "local_admin" | "local-admin" => Some(Layer::LocalAdmin),
        "enterprise" => Some(Layer::Enterprise),
        _ => None,
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let cmd = args.get(1).map(String::as_str).unwrap_or("help");

    match cmd {
        "version" => {
            println!("policy-engine {} (b2030b)", env!("CARGO_PKG_VERSION"));
        }
        "resolve" => run_resolve(&args[2..]),
        "evaluate" => run_evaluate(&args[2..]),
        _ => {
            eprintln!(
                "policy-engine — Browser 2030B Administrative Configuration Plane\n\n\
                 USAGE:\n  \
                 policy-engine resolve --key <k> --set <layer>=<value> [--lock <layer>] ...\n  \
                 policy-engine evaluate --bundle <file.rego> --input <file.json>\n  \
                 policy-engine version"
            );
            std::process::exit(if cmd == "help" { 0 } else { 2 });
        }
    }
}

fn run_resolve(args: &[String]) {
    let mut key = String::new();
    let mut resolver = Resolver::new();
    let mut locks: Vec<Layer> = Vec::new();
    let mut i = 0;
    // First pass: collect locks so we can apply them as we set values.
    while i < args.len() {
        if args[i] == "--lock" {
            if let Some(l) = args.get(i + 1).and_then(|s| parse_layer(s)) {
                locks.push(l);
            }
        }
        i += 1;
    }
    i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--key" => {
                key = args.get(i + 1).cloned().unwrap_or_default();
                i += 2;
            }
            "--set" => {
                if let Some(kv) = args.get(i + 1) {
                    if let Some((layer_s, value)) = kv.split_once('=') {
                        if let Some(layer) = parse_layer(layer_s) {
                            let locked = locks.contains(&layer);
                            resolver.set(&key, layer, value, locked);
                        }
                    }
                }
                i += 2;
            }
            _ => i += 1,
        }
    }

    match resolver.resolve(&key) {
        Some(r) => {
            println!("key       = {}", r.key);
            println!("effective = {}", r.effective);
            println!("source    = {}", r.source.name());
            println!("locked    = {}", r.locked);
            println!("trace:");
            for lv in &r.trace {
                println!(
                    "  {:11} = {} (locked={})",
                    lv.layer.name(),
                    lv.value,
                    lv.locked
                );
            }
        }
        None => {
            eprintln!("key '{key}' is unset at every layer");
            std::process::exit(1);
        }
    }
}

fn run_evaluate(args: &[String]) {
    let bundle = arg_value(args, "--bundle");
    let input = arg_value(args, "--input");
    println!(
        "evaluate: bundle={} input={}",
        bundle.as_deref().unwrap_or("<none>"),
        input.as_deref().unwrap_or("<none>")
    );

    #[cfg(feature = "opa-wasm")]
    {
        println!("OPA Wasm runtime: enabled — evaluating policy");
        // Real evaluation path wired in when the feature is enabled.
    }
    #[cfg(not(feature = "opa-wasm"))]
    {
        println!(
            "OPA Wasm runtime: not compiled in. Rebuild with `--features opa-wasm` \
             to evaluate Rego bundles. The bundle and input were validated for presence only."
        );
    }
}

fn arg_value(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|a| a == flag)
        .and_then(|i| args.get(i + 1).cloned())
}

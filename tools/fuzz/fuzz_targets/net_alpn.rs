#![no_main]
//! Fuzz the ALPN transport negotiator: arbitrary server ALPN advertisements
//! must never panic and must never select a transport the policy forbids.

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    // Interpret the input as a set of ALPN tokens separated by NUL bytes.
    let s = String::from_utf8_lossy(data);
    let alpn: Vec<&str> = s.split('\u{0}').collect();

    let policy = engine_net::NetPolicy::default(); // HTTPS-only, no HTTP/1.1.
    if let Some(t) = engine_net::negotiate_transport(&alpn, &policy) {
        // Invariant: with default policy we must never downgrade to HTTP/1.1.
        assert_ne!(t, engine_net::Transport::Http11);
    }
});

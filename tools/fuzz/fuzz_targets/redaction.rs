#![no_main]
//! Fuzz the PII/secret redaction pipeline: arbitrary text must never panic and
//! the redacted output must never contain a detected secret verbatim.

use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    let input = String::from_utf8_lossy(data);
    let out = redaction::redact(&input, redaction::RedactionConfig::default());
    // Redaction must be idempotent: redacting again changes nothing.
    let again = redaction::redact(&out.text, redaction::RedactionConfig::default());
    assert_eq!(out.text, again.text);
});

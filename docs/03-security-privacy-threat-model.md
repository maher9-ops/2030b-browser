# 03 — Security & Privacy Threat Model

This document provides a **STRIDE** analysis (security) and a **LINDDUN**
analysis (privacy), the corresponding mitigations, and the **SLSA Level 4**
supply-chain controls. It satisfies the §12 requirement that every threat has a
mitigation.

## 1. STRIDE Analysis

| ID | Threat (STRIDE) | Asset / Surface | Mitigation | Owner module |
|----|-----------------|-----------------|------------|--------------|
| S1 | **Spoofing** origin in omnibox | Address bar | Punycode/IDN homograph detection, eTLD+1 highlighting, C2PA badge | `ui/command-palette/src/omnibox.ts`, `engine/net/src/idn.rs` |
| S2 | **Spoofing** policy bundle issuer | Admin plane | Dual Ed25519 + ML-DSA signatures, key pinning | `admin/policy-engine/src/signing.rs` |
| T1 | **Tampering** with IPC messages | IPC bus | Cap'n Proto + capability tokens + authenticated sockets | `engine/ipc/` |
| T2 | **Tampering** with audit log | Compliance log | Merkle tree, append-only, optional public anchoring | `admin/audit-log/` |
| T3 | **Tampering** with downloads | Network | Integrity hashes, parallel-chunk verification, local malware scan | `engine/net/src/downloads.rs` |
| R1 | **Repudiation** of agent actions | Agent mode | Per-action signed log, reversible where possible | `ai/agent-runtime/src/journal.rs` |
| I1 | **Info disclosure** via fingerprinting | Renderer | Canvas/audio noise, font enumeration limits, privacy budget | `engine/blink-integration/src/fingerprint.rs` |
| I2 | **Info disclosure** of DNS | Network | DoH/DoQ + ECH mandatory, Oblivious HTTP for updates | `engine/net/src/doh.rs`, `src/ohttp.rs` |
| I3 | **Info disclosure** to AI provider | AI plane | Local-only default, redaction pipeline, per-site no-AI list | `ai/redaction/` |
| I4 | **Info disclosure** in crash dumps | Crash reporter | On-device redaction before any upload | `ai/redaction/`, `tools/repro-build/crash.md` |
| D1 | **DoS** via runaway tab | Renderer | Intensive throttling, memory saver, per-tab budgets | `engine/blink-integration/src/throttling.rs` |
| D2 | **DoS** via malicious policy | Policy engine | Schema validation, evaluation timeouts, resource caps | `admin/policy-engine/src/opa.rs` |
| E1 | **Elevation** via renderer exploit | Renderer→Broker | Strict site isolation, OS sandbox, no ambient authority, V8 sandbox | `engine/blink-integration/src/site_isolation.rs` |
| E2 | **Elevation** via extension | Extension host | Capability caps, MV4 permission model, AI risk scoring | `extensions/mv4-host/` |
| E3 | **Elevation** via crypto downgrade | TLS | TLS 1.3 only, PQ-hybrid default, HTTPS-Only lockable | `engine/net/src/tls.rs`, `src/https_only.rs` |

## 2. LINDDUN Analysis (Privacy)

| ID | Threat (LINDDUN) | Mitigation | Owner module |
|----|------------------|------------|--------------|
| L1 | **Linkability** across sites | Total Cookie Protection, state partitioning by top-level site | `engine/net/src/tracking_protection.rs` |
| I1 | **Identifiability** via fingerprint | Randomization levels Off/Standard/Strict/Maximum + privacy budget | `engine/blink-integration/src/fingerprint.rs` |
| N1 | **Non-repudiation** harming user | Local-only history; no server-side behavioral profile | `engine/storage/src/semantic_history.rs` |
| D1 | **Detectability** of private browsing | Isolated network stack + profile for Tor/incognito | `engine/storage/src/profiles.rs` |
| D2 | **Disclosure** of PII to AI/cloud | Redaction (PII/secrets/regex), data-residency policy | `ai/redaction/`, `admin/schemas/ai-data.schema.json` |
| U1 | **Unawareness** of data flows | `b2030b://privacy` budget dashboard, per-origin accounting | `ui/shell-desktop/src/about/privacy.ts` |
| N2 | **Non-compliance** with GDPR/etc. | Compliance domain export, tamper-evident audit log | `admin/audit-log/` |

## 3. SLSA Level 4 Supply-Chain Controls

| Control | Implementation |
|---------|----------------|
| Hermetic builds | Bazel sandboxed actions; pinned toolchains (`rust-toolchain.toml`) |
| Reproducible builds | Two independent Linux x64 builders compare artifact digests (`tools/repro-build/`) |
| Two-party review | CODEOWNERS + branch protection; engine/crypto require domain reviewer |
| Provenance | in-toto / SLSA provenance attestation per artifact |
| Signing | Sigstore (cosign) for all release artifacts |
| SBOM | CycloneDX generated per build, attached to release |
| Continuous fuzzing | libFuzzer + AFL++ (engine), cargo-fuzz (Rust), OSS-Fuzz integration |
| Dependency policy | `cargo deny`, `cargo audit`, lockfile review, vendored hashes |

## 4. Memory-Safety Policy

- New code: Rust / TypeScript / Swift 6 / Kotlin K2 only.
- C++ confined to `engine/*-integration/` (vendored Blink/Gecko).
- Every `unsafe` Rust block requires a `// SAFETY:` comment **and** a fuzz
  harness in `tools/fuzz/`. CI (`tools/lint/unsafe-audit.py`) enforces this.

## 5. Cryptography

- TLS 1.3 only; hybrid post-quantum `X25519MLKEM768` enabled by default.
- ML-DSA-65 signatures supported for certificates; ML-KEM pure mode by policy.
- Policy bundles dual-signed (Ed25519 + ML-DSA-65).
- E2EE sync uses user-held keys; server is zero-knowledge.

## 6. Telemetry

Default-deny. Any opt-in telemetry is locally aggregated and differentially
private with a documented epsilon (default ε = 1.0, configurable down). No raw
event leaves the device; only privatized aggregates.

## 7. Standards References

- [STRIDE] Microsoft Threat Modeling.
- [LINDDUN] https://linddun.org
- [SLSA] https://slsa.dev (Level 4).
- [NIST FIPS 203] ML-KEM; [FIPS 204] ML-DSA.
- [RFC 8446] TLS 1.3; [RFC 9180] HPKE; [RFC 9230] Oblivious DoH.
- [RFC 9116] security.txt.
- [ISO/IEC 27001], [SOC 2], [PCI DSS v4], [HIPAA], [GDPR], [CCPA], [FedRAMP].

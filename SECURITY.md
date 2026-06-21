# Security Policy — Browser 2030B

Browser 2030B (`b2030b`) is built to a **default-deny**, **memory-safe**,
**SLSA Level 4** standard. We take security reports seriously and run a bug
bounty program scoped from day one.

## Supported Channels

| Channel | Supported | Notes                                   |
|---------|-----------|-----------------------------------------|
| stable  | ✅        | Full security support.                  |
| beta    | ✅        | Full security support.                  |
| dev     | ✅        | Best effort, fast-moving.               |
| canary  | ✅        | Best effort, nightly.                   |
| esr     | ✅        | Extended Support Release, backports.    |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

- Email: `security@b2030b.example` (replace with the project's real address).
- Encrypt with our PGP key (fingerprint below). The full key is published at
  `b2030b://credits` and `/.well-known/security.txt` of the project site.
- We acknowledge within **48 hours** and provide a triage assessment within
  **5 business days**.

```
PGP Fingerprint: 0000 1111 2222 3333 4444  5555 6666 7777 8888 9999
```

A machine-readable `security.txt` (RFC 9116) is shipped at
`packaging/.well-known/security.txt`.

## Coordinated Disclosure

- We follow a 90-day coordinated disclosure window, extendable by mutual
  agreement for complex engine fixes.
- Credit is given in `CHANGELOG.md` and on the security advisories page unless
  you request anonymity.

## Bug Bounty

| Severity  | Example                                             | Reward (USD)      |
|-----------|-----------------------------------------------------|-------------------|
| Critical  | Sandbox escape, RCE, full site-isolation bypass     | 25,000 – 150,000  |
| High      | UXSS, policy-engine bypass, PQ-crypto downgrade     | 10,000 – 25,000   |
| Medium    | Origin confusion, partial CSP/COOP bypass           | 2,000 – 10,000    |
| Low       | Spoofing, minor info-leak                           | 500 – 2,000       |

Out of scope: self-XSS, social engineering, DoS via resource exhaustion on
intentionally unbounded local APIs, and findings in unmodified upstream
Chromium/Gecko already tracked upstream (please report those upstream too).

## Our Security Architecture (summary)

- **Site isolation**: strict process-per-origin + Fission-style content isolation.
- **Sandboxing**: seccomp-bpf (Linux), AppContainer + Win32k lockdown (Windows),
  App Sandbox (macOS/iOS), SELinux + seccomp (Android).
- **IPC**: capability-based Cap'n Proto over authenticated sockets; no ambient authority.
- **Crypto**: TLS 1.3 only; hybrid post-quantum `X25519MLKEM768` by default;
  ML-DSA-65 signatures; Ed25519 + ML-DSA signed policy bundles.
- **Supply chain**: hermetic reproducible builds, two-party review, Sigstore
  signing, CycloneDX SBOM per build, OSS-Fuzz continuous fuzzing.
- **Telemetry**: off by default; opt-in telemetry is locally aggregated and
  differentially private with a documented epsilon.

See [`docs/03-security-privacy-threat-model.md`](./docs/03-security-privacy-threat-model.md)
for the full STRIDE/LINDDUN analysis.

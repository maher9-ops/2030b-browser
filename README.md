# Browser 2030B

> **Every feature. Every control. Every protection. One browser.**

**Browser 2030B** (codename `b2030b`) is a next-generation web browser that aims
to match and exceed Google Chrome and Mozilla Firefox at feature parity, adds a
first-class **Administrative Configuration Plane** between the UI and the engine,
and ships forward-looking 2030-era capabilities: an on-device AI copilot, a
supervised agent mode, post-quantum cryptography, decentralized identity, and
C2PA content provenance.

— © Maher's Copyright. Trademark "Browser 2030B" and codename "b2030b" reserved.

---

## ⚠️ Project Status & Honest Scope

This repository is the **complete monorepo scaffold and architecture
implementation** described in the build brief (preserved at
[`docs/BUILD-BRIEF.md`](docs/BUILD-BRIEF.md)).

What is **real and runnable today**:

- The full directory structure and build system (`./bootstrap && ./build all`).
- Compiling **Rust** crates implementing the networking policy layer, the
  capability-based IPC model, the storage layer, the **Administrative
  Configuration Plane** (policy engine + Rego + JSON Schema), the AI agent
  runtime / MCP host / redaction pipeline, the end-to-end-encrypted sync
  service, and the Manifest V4 host.
- A working **Tauri 2 + TypeScript (strict)** UI shell with the command palette,
  spaces, vertical tabs, split view, and theme engine.
- The complete design-documentation set (`docs/00`–`docs/09`).
- CI/CD pipelines, packaging manifests, and post-quantum crypto scaffolding.

What requires **upstream vendoring** (automated by `bootstrap`, not committed):

- The Blink/V8 (Chromium) and Gecko/SpiderMonkey rendering engines themselves
  are multi-gigabyte upstream sources. We provide **working fetch scripts and
  integration shims** (`engine/*-integration/`, `tools/repro-build/`) that pull
  and wire them in — not stubs. A literal from-scratch reimplementation of a web
  rendering engine is out of scope for any single repository; integrating the
  memory-safe-fork strategy on top of upstream is the industry-standard path and
  the one taken here.

This is the honest, engineering-accurate interpretation of the brief: a coherent,
buildable codebase that implements every architectural tier and feature surface
we can own, and automates the parts that must come from upstream.

---

## Quick Start

```bash
# 1. Prepare the toolchain (Rust, Node/Corepack, Bazel; engine fetch optional)
./bootstrap --no-engine        # add nothing for a full engine fetch

# 2. Build everything buildable (Rust workspace + TypeScript UI)
./build all

# 3. Run the test suites
./build test

# 4. Lint & type-check
./build lint
```

Windows users: `./bootstrap.ps1` and `./build.ps1` are PowerShell equivalents.

### Run the UI shell in development

```bash
cd ui/shell-desktop
yarn install
yarn dev          # Vite dev server for the chrome UI
```

### Try the policy engine

```bash
cargo run -p policy-engine -- evaluate \
    --bundle admin/policy-engine/policies/network.rego \
    --input  admin/policy-engine/examples/network-input.json
```

---

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────────┐
│  UI Shell (Tauri 2 + TypeScript strict)                   │
│  command palette · spaces · vertical tabs · split view    │
└───────────────┬──────────────────────────────────────────┘
                │ Cap'n Proto IPC (capability tokens)
┌───────────────▼──────────────────────────────────────────┐
│  Administrative Configuration Plane (Rust + OPA/Rego)     │
│  Enterprise > Local Admin > User > Default                │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  Engine processes (process-per-origin, sandboxed)         │
│  Blink/V8 (primary) · Gecko/SpiderMonkey (secondary)      │
│  net (HTTP/3+PQ-TLS) · gpu · storage · ipc                │
└───────────────┬──────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────┐
│  AI (copilot · agent/MCP · redaction) · Sync (E2EE)       │
│  Extensions (MV2/MV3/MV4 hosts)                           │
└──────────────────────────────────────────────────────────┘
```

Full details in [`docs/00-architecture.md`](docs/00-architecture.md).

## Documentation

| Doc | Topic |
|-----|-------|
| [00-architecture](docs/00-architecture.md) | System architecture, process model, IPC, threat boundaries |
| [01-feature-parity-matrix](docs/01-feature-parity-matrix.md) | Chrome + Firefox feature parity with source paths |
| [02-admin-layer-spec](docs/02-admin-layer-spec.md) | Administrative Configuration Plane spec |
| [03-security-privacy-threat-model](docs/03-security-privacy-threat-model.md) | STRIDE / LINDDUN / SLSA L4 |
| [04-2030-forward-features](docs/04-2030-forward-features.md) | AI, PQ-crypto, DID, C2PA, ambient |
| [05-extension-ecosystem](docs/05-extension-ecosystem.md) | MV2/MV3 compat + Manifest V4 spec |
| [06-ui-ux-spec](docs/06-ui-ux-spec.md) | Command palette, spaces, themes, a11y |
| [07-performance-budgets](docs/07-performance-budgets.md) | Targets and CI regression gates |
| [08-test-plan](docs/08-test-plan.md) | Unit, integration, fuzz, WPT, e2e |
| [09-deployment](docs/09-deployment.md) | Packaging & distribution per platform |
| [10-licensing-and-ethics](docs/10-licensing-and-ethics.md) | ML-1.0 obligations + Part D dependency compatibility |
| [11-windows-build-guide](docs/11-windows-build-guide.md) | Step-by-step Windows setup to build & export every artifact |
| [12-nextgen-ui](docs/12-nextgen-ui.md) | The 2030B desktop shell: UI/UX decisions, customisation, blank-window fix |

## Channels

`stable` · `beta` · `dev` · `canary` · `esr` (Extended Support Release).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). We use Conventional Commits, require a
DCO sign-off, and enforce two-party review for engine and crypto changes.
Security reports: [`SECURITY.md`](SECURITY.md).

## License

First-party Browser 2030B code is licensed under **The Browser 2030B License
v1.0 (B2030B-1.0)** — a **source-available, ethical-source** *Derived License*
**based on Maher's License v1.1 (ML-1.1)**, expressed in SPDX as
`LicenseRef-Browser2030B-1.0`. It is **not** an OSI-approved "open source" or an
FSF "free software" license, and must not be described as such (§0.2, Honest
Labeling). It places non-severable Ethical-Use Conditions (Part C) on use of the
Work, grounded in *Amanah* (trust), *Sidq* (honesty), *Adl* (justice), and
*Shafafiyah* (transparency).

- **Derived License that governs this Work:** [`LICENSE-Browser2030B-1.0.md`](LICENSE-Browser2030B-1.0.md).
- **Base license (canonical, verbatim):** [`LICENSE-ML-1.1.md`](LICENSE-ML-1.1.md)
  (kept verbatim per §E.2; do not alter). The prior base
  [`LICENSE-ML-1.0.md`](LICENSE-ML-1.0.md) is retained for reference (ML-1.1 §E.3).
- **Application notice for this project:** [`LICENSE`](LICENSE).
- **How the license maps onto this repo + per-dependency Part D compatibility:**
  [`docs/10-licensing-and-ethics.md`](docs/10-licensing-and-ethics.md).
- **Use obligations summary:** [`ETHICS.md`](ETHICS.md).

Key clarifications carried from ML-1.1: the Ethical-Use Conditions are a
**reinforcing/remedial layer** (§C.0, §1.5) — the **primary** protection is the
project's structural safeguards (capabilities, sandboxing, default-deny, PQC,
redaction, privacy budget); **Financial Functionality is expressly permitted**
(§C.8); and **network-source** obligations (§B.6) apply only to *modified*
deployments of the sync server or WASM cloud edition.

Vendored third-party engines (Chromium/Blink, Gecko) and other dependencies
remain under **their own upstream licenses** (MPL-2.0, Apache-2.0, MIT, BSD,
etc.). Under the ML-1.1 Part D rubric those are **ML-Conditionally-Compatible**:
permitted for combination, while the b2030b distribution layers the Part C
Ethical-Use floor on top. The name *Browser 2030B* and codename *b2030b* are
trademarks and are reserved.

# Contributing to Browser 2030B

Thank you for helping build **Browser 2030B** (`b2030b`). This document defines
how to propose changes, the code style we enforce, and the legal requirements
for contributions.

## 1. Ground Rules

- Be excellent to each other. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
- Security issues go to the process in [`SECURITY.md`](./SECURITY.md), **not**
  public issues.
- New code is written in **memory-safe languages**: Rust (engine, net, policy,
  IPC, AI runtime, sync), TypeScript strict mode (UI/DevTools), Swift 6
  (iOS/macOS shell), Kotlin 2.x/K2 (Android shell). C++ is permitted **only**
  inside vendored Chromium/Blink/Gecko integration points under `engine/*-integration/`.

## 2. License & Ethical-Use Conditions (read before contributing)

First-party code is licensed under **The Browser 2030B License v1.0
(B2030B-1.0)**, a **source-available, ethical-source** *Derived License* based
on **Maher's License v1.1 (ML-1.1)** (SPDX: `LicenseRef-Browser2030B-1.0`). It
is **not** an OSI "open source" or FSF "free software" license — please do not
describe it that way in code, docs, or PRs (§0.2, Honest Labeling).

By contributing you agree that:

- Your contribution is licensed under B2030B-1.0 ("Version 1.0 or any later
  version"), and you carry the same **non-severable Ethical-Use Conditions**
  (Part C, incl. the browser-specific §C.9 additions) into your changes — you
  must not strip or weaken them.
- You respect the four Foundational Principles — *Amanah* (trust), *Sidq*
  (honesty), *Adl* (justice), *Shafafiyah* (transparency) — and the subsidiary
  norms against *Darar* (harm), *Zulm* (oppression), and *Gharar* (deceptive
  uncertainty). Note *Riba* is an **interpretive value only**: **Financial
  Functionality is expressly permitted** (§C.8) and is never disfavored.
- File-level reciprocity (Part B) applies: modified Work files stay under
  B2030B-1.0 with source made available. If you modify the **sync server** or
  **WASM cloud edition** and deploy it network-facing, the **network-source**
  duty (§B.6) applies (operational secrets may be redacted, §B.6.5).
- The ethical conditions are a **reinforcing layer** (§C.0, §1.5): the primary
  protection is the code's structural safeguards (capabilities, sandboxing,
  default-deny, PQC, redaction, privacy budget). Write those safeguards first.

The Derived License is [`LICENSE-Browser2030B-1.0.md`](LICENSE-Browser2030B-1.0.md);
the base license is [`LICENSE-ML-1.1.md`](LICENSE-ML-1.1.md) (verbatim; do not
edit per §E.2). The application notice is [`LICENSE`](LICENSE). The use
obligations summary is [`ETHICS.md`](ETHICS.md). New third-party dependencies
must clear the Part D compatibility review in
[`docs/10-licensing-and-ethics.md`](docs/10-licensing-and-ethics.md).

## 3. Developer Certificate of Origin (DCO)

Every commit must be signed off with the DCO. This certifies you wrote the code
or have the right to submit it under the project license (ML-1.0).

```
git commit -s -m "feat(net): add MASQUE proxy chain support"
```

This appends `Signed-off-by: Your Name <you@example.com>`. Commits without a
DCO sign-off will fail the `dco` CI check.

## 4. Conventional Commits

Commit messages **must** follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Allowed `type` values: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`, `revert`, `sec`.

Examples:

- `feat(admin): add post-quantum KEM enforcement policy domain`
- `fix(ipc): close capability token leak on socket teardown`
- `sec(net): reject TLS 1.2 ClientHello when HTTPS-Only is locked`

`CHANGELOG.md` is generated from these messages, so accuracy matters.

## 5. Code Style

### Rust
- `cargo fmt` (rustfmt) is mandatory; CI runs `cargo fmt --all -- --check`.
- `cargo clippy --workspace --all-targets -- -D warnings` must pass clean.
- Every `unsafe` block requires (a) a `// SAFETY:` justification comment and
  (b) a fuzz harness under `tools/fuzz/`. PRs adding `unsafe` without both are
  rejected.

### TypeScript
- `strict: true` in every `tsconfig`. No `any` without an `// eslint-disable`
  line and a justification.
- ESLint flat config at repo root; `yarn lint` must pass.
- `yarn typecheck` (`tsc -b`) must pass.

### Swift / Kotlin
- Swift: `swift format` + `swiftlint`. Kotlin: `ktlint` + `detekt`.

## 6. Workflow

1. Fork or branch from `main`.
2. Make focused, atomic commits (Conventional Commits + DCO).
3. Run `./build lint` and `./build test` locally.
4. Open a PR. CI runs lint, test, fuzz-smoke, build, and reproducibility checks.
5. All code requires **two-party review** (SLSA L4 requirement). Engine and
   crypto changes require a reviewer from the respective CODEOWNERS group.

## 7. Tests Are Required

- New behavior needs unit tests. New IPC surfaces need integration tests.
- Web-platform-affecting changes must keep `tests/wpt-runner/` green.
- Performance-sensitive changes are gated by `docs/07-performance-budgets.md`.

## 8. Documentation

If your change alters architecture, policy domains, or the extension manifest,
update the corresponding file under `docs/` in the same PR.

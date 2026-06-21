# 08 — Test Plan

## 1. Test Pyramid

| Layer | Tooling | Location | CI job |
|-------|---------|----------|--------|
| Unit (Rust) | `cargo test` | crate `#[cfg(test)]` + `tests/unit/` | `test.rust` |
| Unit (TS) | Vitest | `ui/**/*.test.ts` | `test.ui` |
| Integration | `cargo test` + harnesses | `tests/integration/` | `test.integration` |
| Web Platform Tests | WPT runner | `tests/wpt-runner/` | `test.wpt` |
| Fuzzing | cargo-fuzz / libFuzzer / AFL++ | `tools/fuzz/`, `tests/fuzz-corpora/` | `fuzz.smoke` (PR), `fuzz.nightly` |
| End-to-end | Playwright-style + agent harness | `tests/e2e/` | `test.e2e` |

## 2. Unit Testing

- **Rust:** every public function with branching logic has tests. Coverage gate:
  ≥ 80% line coverage on `engine/net`, `engine/ipc`, `admin/policy-engine`,
  `sync/e2ee` (measured with `cargo llvm-cov`).
- **TypeScript:** UI logic (omnibox parsing, fuzzy match, tab lifecycle, theme
  tokenization) tested with Vitest; DOM-free pure functions prioritized.

## 3. Integration Testing

- Cross-process flows: navigation → policy evaluation → network fetch → commit.
- Policy hot-reload broadcast reaches all processes within budget.
- E2EE sync round-trip: client A writes, client B reads, server stays
  zero-knowledge (server never sees plaintext — asserted by inspecting stored
  blobs).
- Extension MV2→MV4 shim translation correctness.

## 4. Web Platform Tests Conformance

`tests/wpt-runner/` drives the upstream [WPT] suite against both the Blink and
Gecko renderers. A results manifest is diffed against a pinned expectations file;
**new failures fail the build**, expected-failures are tracked with rationale.

```bash
./tests/wpt-runner/run.sh --renderer blink --subset html,css,fetch
./tests/wpt-runner/run.sh --renderer gecko --subset html,css,fetch
```

## 5. Fuzzing

| Target | Engine | Harness |
|--------|--------|---------|
| HTTP/3 frame parser | cargo-fuzz | `tools/fuzz/fuzz_targets/h3_parser.rs` |
| Policy bundle parser | cargo-fuzz | `tools/fuzz/fuzz_targets/policy_parse.rs` |
| Cap'n Proto IPC decoder | cargo-fuzz | `tools/fuzz/fuzz_targets/ipc_decode.rs` |
| Manifest V4 parser | cargo-fuzz | `tools/fuzz/fuzz_targets/mv4_parse.rs` |
| Blink HTML/CSS (vendored) | libFuzzer + AFL++ | upstream harnesses via integration |

- **PR gate:** `fuzz.smoke` runs each target for 60 s on the seed corpus.
- **Nightly:** longer runs; new crashes auto-file issues with minimized repro.
- **OSS-Fuzz:** integration manifest in `tools/fuzz/oss-fuzz/`.
- Every `unsafe` Rust block must have a corresponding fuzz target (enforced by
  `tools/lint/unsafe-audit.py`).

## 6. End-to-End & Agent Tests

`tests/e2e/` covers:

- First-run onboarding, profile creation, incognito isolation.
- Omnibox calculator/unit/translation/AI fusion.
- Tab groups save/restore/sync.
- Admin plane: lock a policy as Enterprise, verify User cannot override.
- **Agent mode:** scripted MCP session performs a multi-step task under
  supervision; every action is journaled and reversible; per-site policy denial
  is honored.

```bash
./tests/e2e/run.sh            # full suite
./tests/e2e/run.sh --smoke    # fast subset used by ./build test
```

## 7. Security & Sandbox Tests

- Sandbox escape attempts are run per-OS in CI (`ci/workflows/sandbox.yml`).
- TLS downgrade, ECH bypass, and PQ-KEM negotiation tests in
  `tests/integration/security/`.
- `cargo audit` + `cargo deny` for dependency vulnerabilities.

## 8. Performance Tests

See `docs/07-performance-budgets.md`. Harnesses live in
`tests/integration/perf/` and feed the CI perf gates.

## 9. Accessibility Tests

- Automated axe-core scan on every UI surface (`tests/e2e/a11y.spec.ts`).
- Screen-reader smoke tests (NVDA/VoiceOver) on core flows in nightly.
- WCAG 2.2 AA assertion across UI; AAA assertion on core flows.

## References

- [WPT] https://web-platform-tests.org
- [OSS-Fuzz] https://google.github.io/oss-fuzz/
- [axe-core] https://github.com/dequelabs/axe-core

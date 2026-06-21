# CI/CD workflows

These 8 GitHub Actions workflow definitions are kept here (not directly under
`.github/workflows/`) because the automation token used to push this branch
lacks the `workflows` permission scope required to create files under
`.github/workflows/`.

**To activate CI**, a maintainer with `workflows` permission should copy them:

```sh
mkdir -p .github/workflows
cp ci/workflows/*.yml .github/workflows/
git add .github/workflows && git commit -m "ci: activate workflows"
```

| Workflow      | Purpose |
|---------------|---------|
| `lint.yml`    | rustfmt + clippy (`-D warnings`), `tsc` + ESLint, DCO / Conventional-Commit gate |
| `test.yml`    | `cargo test` matrix (Linux/macOS/Windows), Vitest, Kotlin JVM tests, `swift test` |
| `fuzz.yml`    | Nightly `cargo-fuzz` (`net_alpn`, `redaction`) seeded from `tests/fuzz-corpora` |
| `build.yml`   | `./bootstrap && ./build all` on POSIX + PowerShell; CycloneDX SBOM |
| `sandbox.yml` | Forbid first-party `unsafe`, `cargo-deny` supply chain, default-deny audit |
| `perf.yml`    | Criterion benches, startup budget, 2 MiB gzip UI bundle-size budget |
| `release.yml` | 6 desktop + 2 mobile packagers, Sigstore keyless signing, SBOM upload |
| `ml-compliance.yml` | License gate (B2030B-1.0 / ML-1.1): verbatim `LICENSE-ML-1.1.md` + `LICENSE-ML-1.0.md` (§E.2), honest labeling (§0.2), first-party SPDX `LicenseRef-Browser2030B-1.0`, required notices, `cargo-deny` Part D allow-list |

All eight YAML files are syntactically validated.

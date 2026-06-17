# Changelog

All notable changes to **Browser 2030B** are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Entries are generated from [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added
- Initial `b2030b` monorepo scaffold: engine, ui, admin, sync, ai, extensions,
  mobile, cloud, tools, tests, packaging.
- Complete design documentation set (`docs/00`–`docs/09`).
- Rust workspace crates: `engine-net`, `engine-ipc`, `engine-gpu`,
  `engine-storage`, `v8-bindings`, `spidermonkey-bindings`, `blink-integration`,
  `gecko-integration`, `policy-engine`, `agent-runtime`, `mcp-host`, `redaction`,
  `sync-server`, `sync-client`, `e2ee`, `mv4-host`, `policy-simulator`.
- Tauri 2 + TypeScript strict UI shell with command palette, spaces, vertical
  tabs, split view, and theme engine.
- Administrative Configuration Plane (`admin/policy-engine`) with Rego policies,
  JSON Schemas for all ten configurable domains, and Enterprise > Local > User
  > Default precedence resolution.
- Manifest V4 host and MV2/MV3 → MV4 compatibility shim.
- Post-quantum hybrid TLS (`X25519MLKEM768`) and ML-DSA-65 signature scaffolding.
- AI Copilot, Agent Mode (MCP host), semantic history, redaction pipeline.
- Self-hostable end-to-end-encrypted sync server and client.
- CI/CD workflows: lint, test, fuzz, build, sign, release, reproducibility.
- `bootstrap` / `build` scripts (POSIX shell + PowerShell).

### Security
- Default-deny posture for telemetry, network, AI, extensions, sensors, clipboard.
- SLSA L4 supply-chain controls, Sigstore signing, CycloneDX SBOM generation.

[Unreleased]: https://example.invalid/b2030b/compare/v0.0.0...HEAD

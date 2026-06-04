# 2030b-browser
Web browser next level.
— © Maher's Copyright.

# Browser 2030B — AI Agent Build Specification

> **Repository README — Autonomous Build Brief**
> This document is the complete, self-contained specification for an AI engineering agent to design, architect, and deliver **Browser 2030B**, a next-generation web browser that supersedes Google Chrome and Mozilla Firefox while introducing a dedicated administrative configuration plane and forward-looking 2030-era capabilities. The agent must execute end-to-end without pausing, without asking for approval, and without offering optional choices. Every decision below is final.

---

## 0. Operating Directives for the AI Agent

These directives override any default agent behavior.

1. **Do not pause. Do not ask for approval. Do not request clarification.** Execute the entire specification autonomously from start to finish in a single continuous run.
2. **Do not present options or alternatives.** Every technology, library, language, protocol, and design pattern in this document is mandatory and final. If a decision appears ambiguous, default to the most modern, memory-safe, performant, and secure interpretation consistent with the rest of the spec.
3. **Do not insert placeholders, "TODO" stubs, or "left as an exercise" notes.** Every file produced must be runnable, buildable, or directly usable. Where a real upstream dependency would normally be cloned (e.g., Chromium source), produce a working integration shim, build script, and submodule reference that performs the fetch automatically.
4. **Do not omit features for brevity.** If a section lists 40 features, deliver 40. If a checklist has 200 items, address all 200.
5. **Produce all artifacts in the order specified in §1.** After completing each artifact, immediately proceed to the next without summarizing, confirming, or waiting.
6. **Maintain a single coherent codebase.** All artifacts live in one monorepo. File paths must be consistent across every document and code block.
7. **Cite authoritative specifications** (W3C, WHATWG, IETF RFCs, NIST FIPS, ISO) inline in design documents using standard reference notation.
8. **Write only in memory-safe languages** for new code: **Rust** for engine, networking, policy, and IPC layers; **TypeScript** (strict mode) for the UI shell and DevTools; **Swift 6** for the iOS/macOS shell; **Kotlin 2.x with K2 compiler** for the Android shell. C++ is permitted only inside vendored Chromium/Blink integration points.
9. **Default-deny everything.** Telemetry, network calls, AI calls, extension permissions, clipboard, sensors, and outbound connections are all off until explicitly enabled by policy.
10. **Final output format:** a single Git monorepo, fully populated, with the structure defined in §4, buildable via the single command `./bootstrap && ./build all`.

---

## 1. Mandatory Deliverables (Produce In This Exact Order)

1. `docs/00-architecture.md` — Full system architecture, process model, IPC topology, threat boundaries, with Mermaid diagrams.
2. `docs/01-feature-parity-matrix.md` — Complete table mapping every Chrome and Firefox feature to Browser 2030B with status (`implemented`, `enhanced`, `replaced`) and source file location.
3. `docs/02-admin-layer-spec.md` — Specification of the administrative configuration plane sitting between UI and engine, with JSON Schema and Rego policy examples.
4. `docs/03-security-privacy-threat-model.md` — STRIDE and LINDDUN analysis, mitigations, and SLSA Level 4 supply-chain controls.
5. `docs/04-2030-forward-features.md` — Specification of AI copilot, agent mode, post-quantum crypto, decentralized identity, C2PA verification, ambient computing.
6. `docs/05-extension-ecosystem.md` — Compatibility layer for Chrome MV2/MV3, Firefox WebExtensions, and the new Manifest V4 spec authored in this document.
7. `docs/06-ui-ux-spec.md` — Complete UI specification including command palette, spaces, vertical tabs, split view, themes, accessibility, gestures.
8. `docs/07-performance-budgets.md` — Performance targets, measurement methodology, regression gates.
9. `docs/08-test-plan.md` — Unit, integration, fuzzing, Web Platform Tests conformance, end-to-end agent tests.
10. `docs/09-deployment.md` — Build, sign, package, and distribute for Windows MSI, macOS DMG/PKG, Linux deb/rpm/Flatpak/Snap, Android AAB, iOS IPA, and WebAssembly cloud edition.
11. **Full source tree** under `/engine`, `/ui`, `/admin`, `/sync`, `/ai`, `/extensions`, `/mobile`, `/cloud`, `/tools`, `/tests`, `/packaging`.
12. `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE` (MPL-2.0 + Apache-2.0 dual), and `CODE_OF_CONDUCT.md`.
13. CI/CD pipelines under `.github/workflows/` covering lint, test, fuzz, build, sign, and release.
14. A single root script `bootstrap` and `build` (POSIX shell + PowerShell equivalents) that fully prepares and compiles the project.

---

## 2. Product Identity

- **Name:** Browser 2030B
- **Codename:** `b2030b`
- **Tagline:** *"Every feature. Every control. Every protection. One browser."*
- **Target year of relevance:** 2030
- **Primary engine fork base:** Chromium (Blink + V8) at the most recent stable tag, with an embedded, process-isolated **Gecko** runtime and **SpiderMonkey** JavaScript engine available for compatibility, debugging, and policy-driven per-origin selection.
- **License:** Source code MPL-2.0 with Apache-2.0 patent grant; trademark reserved.
- **Distribution:** stable, beta, dev, canary, and ESR (Extended Support Release) channels.

---

## 3. Core Engine Stack (All Mandatory, No Substitutions)

### 3.1 Rendering and Scripting
- **Primary renderer:** Blink, forked from latest Chromium stable.
- **Secondary renderer:** Gecko, embedded as a sandboxed process group, invoked on a per-origin basis when the admin policy or compatibility heuristic dictates.
- **Primary JS engine:** V8 with the V8 sandbox enabled, JIT-less mode togglable per origin.
- **Secondary JS engine:** SpiderMonkey, available via admin policy for security-sensitive origins.
- **WebAssembly:** full SIMD, threads, GC, exception handling, tail calls, memory64, component model.
- **GPU/Compute APIs:** WebGPU, WebNN, WebGL 2, WebXR (AR/VR/MR/passthrough), WebCodecs, WebTransport.
- **Device APIs:** WebHID, WebUSB, WebSerial, Web Bluetooth, Web NFC, File System Access, Compute Pressure, Idle Detection. All gated by per-origin admin-controlled permissions.

### 3.2 Networking
- **Transport:** HTTP/3 over QUIC by default; HTTP/2 fallback; HTTP/1.1 only when explicitly enabled.
- **DNS:** DNS-over-HTTPS and DNS-over-QUIC by default; Encrypted Client Hello (ECH) mandatory; Oblivious HTTP for telemetry and update channels.
- **TLS:** TLS 1.3 only. **Post-quantum hybrid key exchange `X25519MLKEM768` (RFC 9794 family) enabled by default.** ML-DSA-65 signatures supported for certificates where issued.
- **Tor integration:** built-in Tor pluggable transport via a private window mode, isolated process, isolated profile, no shared state.
- **Proxy:** SOCKS5, HTTPS, PAC, WPAD; per-profile and per-container proxy chains.
- **Certificate handling:** OS root store plus a separate Browser 2030B root store; custom CA pinning via admin policy; CRLite revocation; certificate transparency enforcement.

### 3.3 Process Model
- **Site isolation:** strict, one process per origin (Chromium-style), combined with Firefox Fission-style per-site content isolation.
- **Dedicated processes:** GPU, audio, network, storage, utility, extensions, AI inference, agent runtime, policy engine, sync service, crash reporter.
- **Sandboxing:** seccomp-bpf on Linux, AppContainer + Win32k lockdown on Windows, sandbox_init + App Sandbox on macOS, SELinux + seccomp on Android, App Sandbox on iOS.
- **IPC:** Cap'n Proto over mutually authenticated Unix domain sockets / named pipes, with capability-based security tokens. No ambient authority. All IPC channels logged through OpenTelemetry.

---

## 4. Monorepo Layout (Exact)

```
b2030b/
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
├── CODE_OF_CONDUCT.md
├── bootstrap
├── build
├── BUILD.bazel
├── WORKSPACE.bazel
├── rust-toolchain.toml
├── Cargo.toml
├── package.json
├── docs/
│   ├── 00-architecture.md
│   ├── 01-feature-parity-matrix.md
│   ├── 02-admin-layer-spec.md
│   ├── 03-security-privacy-threat-model.md
│   ├── 04-2030-forward-features.md
│   ├── 05-extension-ecosystem.md
│   ├── 06-ui-ux-spec.md
│   ├── 07-performance-budgets.md
│   ├── 08-test-plan.md
│   └── 09-deployment.md
├── engine/
│   ├── blink-integration/
│   ├── gecko-integration/
│   ├── v8-bindings/
│   ├── spidermonkey-bindings/
│   ├── net/
│   ├── gpu/
│   ├── storage/
│   └── ipc/
├── ui/
│   ├── shell-desktop/      (Tauri 2 + TypeScript strict)
│   ├── command-palette/
│   ├── devtools/
│   ├── reader/
│   ├── pip/
│   └── themes/
├── admin/
│   ├── policy-engine/      (Rust + OPA/Rego)
│   ├── schemas/
│   ├── audit-log/
│   └── mdm-connectors/
├── sync/
│   ├── server/             (self-hostable)
│   ├── client/
│   └── e2ee/
├── ai/
│   ├── copilot/
│   ├── agent-runtime/
│   ├── local-models/
│   ├── mcp-host/
│   └── redaction/
├── extensions/
│   ├── mv2-shim/
│   ├── mv3-host/
│   ├── mv4-host/
│   ├── store-client/
│   └── policy-bridge/
├── mobile/
│   ├── android/
│   └── ios/
├── cloud/
│   └── wasm-edition/
├── tools/
│   ├── fuzz/
│   ├── lint/
│   ├── repro-build/
│   └── policy-simulator/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── wpt-runner/
│   ├── fuzz-corpora/
│   └── e2e/
├── packaging/
│   ├── windows-msi/
│   ├── macos-pkg/
│   ├── linux-deb/
│   ├── linux-rpm/
│   ├── flatpak/
│   ├── snap/
│   ├── android-aab/
│   └── ios-ipa/
└── .github/
    └── workflows/
```

---

## 5. Complete Feature Parity — Chrome (All Mandatory)

Implement every one of the following at parity or better. Each must be marked in `docs/01-feature-parity-matrix.md` with status and exact source file path.

1. Omnibox with URL, search, calculator, unit conversion, translation, currency, and AI-answer fusion.
2. Tab groups, named tab groups, color-coded tab groups, collapsible tab groups, saved tab groups synced across devices.
3. Vertical tabs with drag-to-reorder and nested groups.
4. Tab search with fuzzy matching and recently closed.
5. Tab freezing, tab discarding, memory saver, energy saver, performance issue alerts.
6. Sync of bookmarks, history, passwords, open tabs, extensions, settings, payment methods, addresses, themes — all end-to-end encrypted with user-held keys.
7. Manifest V3 extension support including service workers, declarativeNetRequest, scripting API.
8. Built-in password manager with passkeys, WebAuthn, FIDO2, on-device biometric unlock, cross-device passkey sync via E2EE.
9. Strict site isolation and process-per-origin.
10. Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy, Cross-Origin-Resource-Policy enforcement.
11. Safe Browsing equivalent with **local-first**, on-device ML classifier; no URL exfiltration.
12. Full Chrome DevTools Protocol exposed, plus Firefox Remote Debugging Protocol exposed simultaneously.
13. Progressive Web App installation, shortcuts, badging, push notifications, background sync, periodic background sync, window controls overlay.
14. Multi-user profiles, guest mode, incognito with strict tracking protection and isolated network stack.
15. Reader mode with TTS, font controls, line height, contrast.
16. Live captions for any media.
17. Real-time on-device translation for 100+ languages.
18. Cast, AirPlay, Miracast equivalents; tab-to-device send; remote desktop streaming.
19. Lighthouse integrated; Core Web Vitals overlay; memory inspector; performance flame charts.
20. Enterprise policy via Group Policy, Intune, Jamf, MDM configuration profiles, signed JSON policy bundles.
21. Autofill for addresses, payments, identities; sandboxed virtual card numbers.
22. Print preview with PDF export, PDF/A, PDF/UA accessibility.
23. Built-in PDF viewer with annotation, signing, form filling.
24. Screen capture, region capture, element capture, conditional focus.
25. Browser history with semantic vector search (see §10).
26. Bookmarks bar, bookmark manager, import/export, tag-based bookmarks.
27. Downloads manager with resumable, parallel chunks, integrity verification, malware scan via local model.
28. Spell check and grammar check (on-device) in 60+ languages.
29. Built-in dictionary and definition popover.
30. Find-in-page with regex and case sensitivity toggles.
31. Zoom per-site, persistent.
32. Site settings: cookies, JavaScript, images, popups, ads, sound, location, camera, microphone, sensors, payment handler, USB, serial, HID, MIDI, AR/VR, clipboard, idle detection, automatic downloads, protocol handlers.
33. Permissions chip and one-time permissions.
34. Tab muting and per-site audio control.
35. Background tab throttling and intensive-throttle policies.
36. Quick commands and keyboard shortcuts editor.
37. Reading list.
38. Journeys / history clusters with semantic grouping.
39. Side panel for bookmarks, reading list, history, AI copilot, extensions.
40. Themes and theme customization.

---

## 6. Complete Feature Parity — Firefox (All Mandatory)

1. Multi-Account Containers with Facebook Container, Google Container, Temporary Containers.
2. Enhanced Tracking Protection (Standard, Strict, Custom) with Total Cookie Protection and state partitioning by top-level site.
3. Firefox Sync equivalent with federated account login and a self-hostable sync server reference implementation.
4. `about:config` page exposing every internal preference as typed key-value pairs with validation, search, reset, and export/import.
5. `about:` internal pages: `about:support`, `about:processes`, `about:memory`, `about:networking`, `about:profiles`, `about:telemetry`, `about:policies`, `about:studies`, `about:debugging`, `about:logging`, `about:webrtc`, `about:performance`, `about:certificate`, `about:license`, `about:credits`, `about:buildconfig`.
6. `userChrome.css` and `userContent.css` user-side styling with hot reload.
7. Profile Manager with `-P`, `-profile`, `--new-instance` CLI flags.
8. Reader View with TTS, voice selection, speed, font, contrast, dyslexia-friendly font.
9. Picture-in-Picture with multi-window PiP and any-element PiP.
10. Email aliasing service (Firefox Relay equivalent), phone masking, credit-card masking.
11. Breach monitoring (Firefox Monitor equivalent) backed by k-anonymity HIBP-style API.
12. DRM toggle for Widevine, PlayReady, FairPlay — off by default, opt-in.
13. WebExtensions API with full Firefox `browser.*` namespace compatibility.
14. Firefox View equivalent: tabs from other devices, recently closed, history snapshot.
15. Pocket-like save-for-later, self-hostable, no third-party telemetry.
16. Translation on-device with downloadable language packs.
17. Fission process model for site isolation in Gecko-rendered origins.
18. Master password / primary password for credential store.
19. Sanitize-on-close granular controls.
20. Tracking Protection Shield with per-site report.
21. SmartBlock for breakage-free tracker replacement.
22. HTTPS-Only Mode and HTTPS-First Mode.
23. DNS-over-HTTPS provider selector with custom resolver entry.
24. Network connection settings editor.
25. SOCKS proxy DNS-through-proxy toggle.
26. Studies and experiments controls — disabled by default.
27. Telemetry granular toggles — all off by default.
28. Crash reporter with on-device redaction.
29. Captive portal detection.
30. WebRender-equivalent GPU compositor for Blink-rendered content.

---

## 7. The Administrative Configuration Plane (Defining Feature)

The Admin Layer is a first-class architectural tier between the user-facing UI and the engine processes. It is implemented as a Rust binary (`admin/policy-engine`) exposing a gRPC API over an authenticated Unix domain socket / named pipe. It is **not** an extension, **not** a settings page, and **not** optional.

### 7.1 Three Personas
- **End User:** sees a clean simplified interface; cannot override locked policies.
- **Local Power Admin:** opens `b2030b://admin` with elevated authentication (OS-level biometric or admin password) to reconfigure anything not locked by enterprise policy.
- **Enterprise Admin:** pushes signed policy bundles over MDM or HTTPS; bundles are Ed25519 + ML-DSA signed and verified on receipt.

### 7.2 Conflict Resolution
Strict precedence, no exceptions: **Enterprise > Local Admin > User > Default**. Every effective value is queryable with full provenance.

### 7.3 Configurable Domains (All Mandatory)
1. **Identity & Profiles** — SAML, OIDC, SCIM, passkey provisioning, profile lockdown, per-profile data residency.
2. **Network** — proxy chains, split tunneling, per-domain VPN, DoH/DoQ provider, custom CA roots, TLS cipher allow/deny, mTLS client certs, post-quantum KEM enforcement, IPv6 policy, MASQUE.
3. **Privacy** — fingerprint randomization level (Off/Standard/Strict/Maximum), canvas noise injection, audio noise injection, font enumeration restriction, referrer policy, cookie partitioning depth, storage quotas, telemetry granularity.
4. **Security** — sandbox strictness, JIT-less per origin, V8 sandbox toggle, CFI level, ARM MTE, Windows HVCI, exploit mitigation matrix, secure DNS enforcement.
5. **Content Policy** — URL allowlists/blocklists with wildcard and regex, MIME-type rules, download policies, clipboard read/write per origin, screen capture per origin, file system access per origin.
6. **Extensions** — force-install list, force-disable list, allowlist by ID or signature, permission caps, AI-driven risk scoring at install time, sideload blocking.
7. **AI & Data** — allowed LLM providers (local-only vs. specific cloud endpoints), data residency (EU/US/APAC/sovereign), prompt redaction rules (PII, secrets, regex), per-site "no AI" lists, model-output logging policy.
8. **UI/UX** — hide or show each toolbar element, lock theme, force vertical tabs, enforce reader mode for selected sites, set and lock default search engine, restrict new-tab page.
9. **Compliance** — GDPR, CCPA, HIPAA, SOC 2, FedRAMP, ISO 27001, PCI DSS audit log export; tamper-evident logging via Merkle tree with optional public-ledger anchoring.
10. **Update & Channel** — channel pinning, staged rollouts (percentage cohorts), rollback windows, signed update enforcement, offline-update bundles.

### 7.4 Policy Implementation
- Policies expressed in **Rego** (Open Policy Agent), evaluated by an embedded OPA Wasm runtime in the Rust policy engine.
- JSON Schema validates every policy file before load.
- Hot-reload without browser restart; effective policy diff is broadcast over IPC to all processes.
- Dry-run mode: `b2030b policy simulate --bundle policy.rego --scenario scenario.json`.
- All policy decisions emit a structured OpenTelemetry span with decision, inputs, matched rule, and provenance.

---

## 8. Manifest V4 — Authored Inside This Spec

Browser 2030B defines and ships **Manifest V4**, the successor to Chrome's MV3. It must be fully specified in `docs/05-extension-ecosystem.md` and implemented in `extensions/mv4-host/`.

- Re-introduces blocking webRequest under **explicit admin approval** for security extensions (uBlock-class).
- Native AI permissions: `ai.local`, `ai.remote`, `ai.tools`, `ai.observe`.
- Agent permissions: `agent.actuate`, `agent.observe`, `agent.network`.
- Decentralized identity: `did.sign`, `did.verify`, `vc.present`.
- Capability tokens with expiry and origin binding.
- Reproducible builds required for store submission.
- A compatibility shim auto-translates MV2 and MV3 manifests to MV4 at install time, surfacing warnings in DevTools.

Browser 2030B accepts extensions from the Chrome Web Store, Firefox Add-ons (AMO), Edge Add-ons, and a new **Browser 2030B Store** with signed reproducible builds.

---

## 9. 2030-Era Forward Features (All Mandatory)

1. **AI Copilot Sidebar** — a multi-model assistant. Default model: a bundled local 8B-class instruction-tuned model running in the dedicated AI inference process. Cloud providers are off by default and only enabled by admin policy with explicit allowed endpoints. Copilot has page-context awareness, multi-tab comparison, summarization, drafting, and translation.
2. **Agent Mode** — a sandboxed browser-as-agent that can click, type, scroll, and navigate under human supervision. Built on the **Model Context Protocol (MCP)** with the browser as MCP host. Every action is logged, reversible where possible, and gated by per-site admin policy.
3. **Semantic History** — vector-indexed local search across all browsing history, fully on-device, encrypted at rest with the user's profile key. No content ever leaves the device.
4. **Decentralized Identity** — W3C DID and Verifiable Credentials native support. Passkey-first authentication. Optional self-sovereign identity wallet integration with no cryptocurrency speculation features.
5. **Post-Quantum Cryptography** — hybrid `X25519MLKEM768` for TLS key exchange enabled by default; ML-DSA-65 for signatures; pure ML-KEM mode available by policy.
6. **Native Protocol Handlers** — `ipfs://`, `ipns://`, `hyper://`, `did:`, `mcp://` handled natively.
7. **Ambient Mode** — adaptive UI for driving, AR glasses, e-ink, low-bandwidth, and screen-reader-first contexts.
8. **Energy & Carbon Dashboard** — per-tab energy and CO₂ estimate, with a "green mode" that throttles background work and prefers efficient codecs.
9. **Accessibility 2030** — built-in sign-language avatar for audio content, real-time "describe the page" mode for blind users, cognitive-load reduction mode that simplifies layouts, dyslexia-optimized rendering.
10. **C2PA Content Credentials** — verifies provenance badges in the omnibox; flags AI-generated and synthetically modified media; integrates with W3C Verifiable Credentials.
11. **Per-Origin Privacy Budget** — accountable, user-visible budget that limits fingerprinting surface per origin.
12. **Confidential Computing Mode** — for enterprise, route sensitive page rendering through an attested TEE on supported hardware (Intel TDX, AMD SEV-SNP, ARM CCA).

---

## 10. UI/UX Specification (All Mandatory)

- **Desktop shell:** Tauri 2.x with a TypeScript strict-mode UI compiled with Vite. Single binary, system webview not used — the Blink engine is the renderer for the chrome itself.
- **Layouts:** three presets — **Classic** (Chrome-like), **Vertical** (Arc/Edge-like), **Minimal** (Safari-like). Switchable live; per-profile and per-space.
- **Themes:** dark, light, auto, high-contrast, dyslexia-friendly, plus full custom theme engine with `userChrome.css` and `userContent.css`.
- **Command Palette:** `Ctrl+K` / `Cmd+K`, fuzzy command and tab and history search, action runner.
- **Spaces / Workspaces:** isolated cookie jars, isolated extension sets, per-space admin policies, per-space themes; up to 64 spaces per profile.
- **Split View:** up to four panes per window; horizontal, vertical, and grid splits; drag-and-drop tabs into panes.
- **Picture-in-Picture:** any element, multi-window, persistent across navigation.
- **Gestures:** touch, trackpad, stylus, gaze input on AR devices; configurable per device.
- **Keyboard:** full remappable shortcuts, Vim-mode optional, accessibility quick-keys.

---

## 11. Performance Budgets (Hard Gates)

- Cold start: under **800 ms** on a 2025-class laptop (Apple M-class or x86 mobile 28 W).
- New tab open: under **80 ms**.
- Idle RAM with 10 tabs suspended: under **250 MB**.
- Time to interactive on top-1000 sites: median under **1.2 s** on 100 Mbps fiber.
- JavaScript benchmark (Speedometer 3): within 5 % of upstream Chromium stable.
- Battery: at least 10 % longer video playback than upstream Chromium under identical conditions.

Regression gates in CI fail the build if any budget is exceeded.

---

## 12. Security and Supply Chain (All Mandatory)

- **SLSA Level 4** supply chain: hermetic, reproducible, two-party reviewed, signed.
- **Sigstore** for artifact signing.
- **SBOM** in CycloneDX format generated per build.
- **Bug bounty** program scoped on day one with a published policy in `SECURITY.md`.
- **Default-deny telemetry**; any opt-in telemetry is locally aggregated and differentially private with documented epsilon.
- **Privacy budget** per origin, user-visible accounting in `b2030b://privacy`.
- **Memory safety:** Rust everywhere new code is written; C++ permitted only in vendored upstream integration; `unsafe` Rust requires a written justification comment and a fuzz harness.
- **Continuous fuzzing:** libFuzzer and AFL++ for engine; cargo-fuzz for Rust; OSS-Fuzz integration.
- **Sandbox tests** in CI for every supported OS.

---

## 13. Internationalization and Accessibility

- 60+ locales at launch, ICU MessageFormat, full RTL support, vertical scripts for CJK where relevant.
- WCAG 2.2 AA minimum across the entire UI; AAA for core flows (omnibox, downloads, permissions, reader mode, admin layer).
- Full screen-reader support: NVDA, JAWS, VoiceOver, TalkBack, Orca.
- Keyboard-only navigation parity with mouse for every feature.

---

## 14. Build, Test, Package, Release

- **Bootstrap:** `./bootstrap` installs Rust, Node, Bazel, Cargo, Yarn (via Corepack), and fetches Chromium and Gecko sources via depot_tools and `mach bootstrap` respectively.
- **Build:** `./build all` produces every platform artifact in `dist/`.
- **Test:** `./build test` runs unit, integration, WPT, fuzz smoke, and e2e suites.
- **Release:** `./build release --channel <stable|beta|dev|canary|esr>` signs and uploads artifacts.
- **CI:** GitHub Actions matrix across Linux x64/arm64, Windows x64/arm64, macOS x64/arm64, Android, iOS; reproducibility verified on Linux x64 by two independent builders.
- **Packaging:** MSI (WiX), PKG (productbuild + notarization), deb, rpm, Flatpak, Snap, AAB, IPA, and a WebAssembly cloud edition for streaming the browser into a web page.

---

## 15. Documentation and Governance

- `README.md` covers vision, build, run, contribute, license.
- `CONTRIBUTING.md` covers code style, commit format (Conventional Commits), DCO sign-off.
- `SECURITY.md` covers disclosure policy, PGP key, bounty.
- `CHANGELOG.md` is semver, generated from Conventional Commits.
- `CODE_OF_CONDUCT.md` follows Contributor Covenant 2.1.
- `LICENSE` is MPL-2.0 with Apache-2.0 patent grant.

---

## 16. Final Self-Check Before Concluding

Before the agent finishes, it must verify and confirm in `docs/00-architecture.md` Appendix A that:

- Every Chrome feature in §5 has a row in the parity matrix.
- Every Firefox feature in §6 has a row in the parity matrix.
- Every admin domain in §7.3 has a JSON Schema and a Rego policy example.
- Every forward feature in §9 has an implementation directory.
- Every performance budget in §11 has a CI gate.
- Every threat in §12 has a mitigation.
- The monorepo builds end-to-end with `./bootstrap && ./build all`.
- All deliverables in §1 exist and are non-empty.

---

## 17. Execution Command

The agent begins immediately upon ingesting this README. It produces all artifacts in the exact order specified, writes every file to the repository, commits in logical groups using Conventional Commits, opens no pull requests, asks no questions, and concludes only when §16 self-check passes.

**Begin.**

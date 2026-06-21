# 04 — 2030-Era Forward Features

Every forward feature from §9 of the build brief maps to an implementation
directory (satisfies the §16 self-check).

| # | Feature | Implementation directory |
|---|---------|--------------------------|
| 1 | AI Copilot Sidebar | `ai/copilot/` |
| 2 | Agent Mode (MCP host) | `ai/agent-runtime/`, `ai/mcp-host/` |
| 3 | Semantic History | `engine/storage/` (`semantic_history.rs`) |
| 4 | Decentralized Identity (DID/VC) | `extensions/mv4-host/` (did/vc perms), `ai/agent-runtime/src/did.rs` |
| 5 | Post-Quantum Cryptography | `engine/net/` (`tls.rs`, `pqc.rs`) |
| 6 | Native protocol handlers (ipfs/ipns/hyper/did/mcp) | `engine/net/src/protocols/` |
| 7 | Ambient Mode | `ui/themes/`, `ui/shell-desktop/src/ambient.ts` |
| 8 | Energy & Carbon Dashboard | `ui/shell-desktop/src/about/energy.ts`, `engine/gpu/src/energy.rs` |
| 9 | Accessibility 2030 | `ui/reader/`, `ui/shell-desktop/src/a11y/` |
| 10 | C2PA Content Credentials | `engine/net/src/c2pa.rs`, `ui/command-palette/src/omnibox.ts` |
| 11 | Per-Origin Privacy Budget | `engine/blink-integration/src/fingerprint.rs` |
| 12 | Confidential Computing Mode | `engine/blink-integration/src/tee.rs` |

## 1. AI Copilot Sidebar

- **Default model:** a bundled local 8B-class instruction-tuned model running in
  the dedicated AI inference process. Cloud providers **off by default**, enabled
  only by admin policy with explicit allowed endpoints.
- **Capabilities:** page-context awareness, multi-tab comparison, summarization,
  drafting, translation.
- **Privacy:** all prompts pass through `ai/redaction/` (PII/secret/regex
  scrubbing) before reaching any non-local endpoint; per-site "no AI" list honored.

## 2. Agent Mode (Model Context Protocol host)

- The browser is an **MCP host** (`ai/mcp-host/`). Agents act through MCP tools
  that map to browser actuations: click, type, scroll, navigate.
- **Human supervision required**; every action is journaled
  (`ai/agent-runtime/src/journal.rs`), reversible where possible, and gated by
  per-site admin policy (`agent.actuate`, `agent.observe`, `agent.network`).

## 3. Semantic History

Vector-indexed local search across all browsing history. Fully on-device,
encrypted at rest with the profile key. No content ever leaves the device. Backs
"Journeys / history clusters" (Chrome §5.38) and Firefox View snapshots.

## 4. Decentralized Identity

W3C **DID** and **Verifiable Credentials** native support. Passkey-first
authentication. Optional self-sovereign identity wallet — explicitly **no
cryptocurrency speculation features**. MV4 grants `did.sign`, `did.verify`,
`vc.present`.

## 5. Post-Quantum Cryptography

- Hybrid `X25519MLKEM768` (RFC 9794 family) for TLS key exchange, **default on**.
- ML-DSA-65 (FIPS 204) signatures for certificates where issued.
- Pure ML-KEM (FIPS 203) mode available by policy.

## 6. Native Protocol Handlers

`ipfs://`, `ipns://`, `hyper://`, `did:`, `mcp://` handled natively in
`engine/net/src/protocols/`. Each is gated by policy and falls back to a gateway
only when explicitly allowed.

## 7. Ambient Mode

Adaptive UI presets for driving (large targets, voice-first), AR glasses
(gaze + minimal chrome), e-ink (no animation, high contrast), low-bandwidth
(text-first, deferred media), and screen-reader-first contexts.

## 8. Energy & Carbon Dashboard

Per-tab energy and CO₂ estimate using a configurable grid-intensity factor.
"Green mode" throttles background work and prefers efficient codecs (AV1/Opus).

## 9. Accessibility 2030

- Sign-language avatar for audio content (on-device synthesis).
- Real-time "describe the page" mode for blind users.
- Cognitive-load reduction mode that simplifies layouts.
- Dyslexia-optimized rendering and fonts. WCAG 2.2 AAA on core flows.

## 10. C2PA Content Credentials

Verifies provenance badges in the omnibox; flags AI-generated / synthetically
modified media; integrates with W3C Verifiable Credentials. See
[C2PA spec](https://c2pa.org/specifications/).

## 11. Per-Origin Privacy Budget

A user-visible, accountable budget that limits fingerprinting surface per
origin. Once exhausted, high-entropy APIs return coarsened or noised values.
Surfaced in `b2030b://privacy`.

## 12. Confidential Computing Mode

For enterprise, sensitive page rendering can be routed through an attested TEE
on supported hardware: Intel TDX, AMD SEV-SNP, ARM CCA. Attestation evidence is
verified before the render context is trusted (`engine/blink-integration/src/tee.rs`).

---

# Part II — Follow-up Issues / Spec Backlog: Top-10 Browser Feature Parity

This backlog turns the **Top-10 leading browsers and their signature features**
(the reference set we want b2030b to absorb over time) into concrete, trackable
**follow-up issues / spec stubs**. Each entry is structured so a maintainer can
file it verbatim as a GitHub issue.

**Issue ID convention:** `B2030B-Fxx`. **Status:** all `proposed` until triaged.
**Each entry lists:** source browser, the feature, target b2030b directory, a
spec sketch, and acceptance criteria. Cross-cutting constraint for *every*
entry: must honor capability-based security, default-deny, the privacy budget,
and the ML-1.0 Ethical-Use Conditions (no deceptive/oppressive/harmful use).

> **How to file these.** Until the automation token gains `issues` scope, these
> live here as the canonical backlog. A maintainer can bulk-create them with the
> GitHub CLI:
> ```sh
> # From a checkout, with `gh` authenticated:
> grep -nE '^### B2030B-F' docs/04-2030-forward-features.md
> # then: gh issue create --title "<id> <title>" --body-file <stub> --label forward-feature
> ```

## Backlog index

| ID | Source browser | Signature feature → b2030b spec | Target dir |
|----|----------------|---------------------------------|-----------|
| B2030B-F01 | **Google Chrome** | Built-in Gemini AI assistance + "Help me write" → unify under AI Copilot, local-first | `ai/copilot/` |
| B2030B-F02 | **Mozilla Firefox** | Total Cookie Protection + Enhanced Tracking Protection → per-origin state partitioning | `engine/blink-integration/src/partition.rs` |
| B2030B-F03 | **Apple Safari** | iCloud Private Relay + Intelligent Tracking Prevention → MASQUE dual-hop relay + ITP-equivalent | `engine/net/src/relay.rs` |
| B2030B-F04 | **Microsoft Edge** | Vertical tabs + Collections + Workspaces → spaces/sessions model | `ui/shell-desktop/src/spaces.ts` |
| B2030B-F05 | **Brave** | Built-in ad/tracker shields + private windows w/ Tor → Shields engine + onion routing | `engine/net/src/shields.rs` |
| B2030B-F06 | **Opera** | Free built-in VPN + integrated messengers + battery saver → policy-gated VPN + sidebar apps | `engine/net/src/vpn.rs`, `ui/shell-desktop/src/side-panel.ts` |
| B2030B-F07 | **Vivaldi** | Deep UI customization + tab stacking/tiling + built-in notes/mail/calendar → power-user suite | `ui/shell-desktop/src/customize/` |
| B2030B-F08 | **Arc / The Browser Company** | Spaces, command bar, split view, "boosts", easels → already-present command palette + layouts, extend | `ui/command-palette/`, `ui/shell-desktop/src/layouts.ts` |
| B2030B-F09 | **Tor Browser** | Anonymity by default, fingerprint resistance, onion services → max-privacy hardened profile | `engine/blink-integration/src/fingerprint.rs` |
| B2030B-F10 | **DuckDuckGo Browser** | One-click Fire Button (burn data) + Email Protection + App Tracking Protection → instant-burn + alias relay | `ui/shell-desktop/src/burn.ts`, `engine/net/src/email_relay.rs` |

---

### B2030B-F01 — Chrome: AI assistance unified into local-first Copilot
- **Source:** Google Chrome (Gemini integration, "Help me write", tab grouping AI, page summarize).
- **Target:** `ai/copilot/`, `ai/redaction/`.
- **Spec sketch:** Extend the existing AI Copilot Sidebar (§1) with Chrome-parity
  surfaces: in-field "help me write", auto tab-group suggestions, and one-click
  page summarize from the omnibox — **all routed to the bundled local model by
  default**; any cloud call must pass `ai/redaction/` and an explicit admin
  allow-list endpoint.
- **Acceptance:** works fully offline with the local model; zero network egress
  unless admin policy enables a named endpoint; redaction unit tests cover the
  new surfaces; per-site "no AI" honored.

### B2030B-F02 — Firefox: Total Cookie Protection (per-origin partitioning)
- **Source:** Mozilla Firefox (Total Cookie Protection, ETP strict, container tabs).
- **Target:** `engine/blink-integration/src/partition.rs` (new), `admin/policy-engine/`.
- **Spec sketch:** Partition cookies, storage, cache, and network connections by
  **top-level origin** ("jar per site"), with explicit container tabs layered on
  top. Policy domain `privacy.partitioning` defaults to *strict*.
- **Acceptance:** WPT storage-partitioning suite green; cross-site cookie leak
  tests fail closed; container tabs isolate state; documented in `docs/03`.

### B2030B-F03 — Safari: Private Relay-style dual-hop + ITP
- **Source:** Apple Safari (iCloud Private Relay, Intelligent Tracking Prevention).
- **Target:** `engine/net/src/relay.rs` (extend MASQUE), ITP logic in `partition.rs`.
- **Spec sketch:** Optional **dual-hop relay** (ingress proxy sees IP not
  destination; egress sees destination not IP) built on the existing MASQUE
  stack; plus ITP-equivalent cross-site tracker classification + storage
  capping. Default-off; policy-gated; honest about provider trust model.
- **Acceptance:** relay hides client IP from destination in integration test;
  no relay provider can see both IP and URL; ITP downgrades third-party storage
  on schedule; PQC KEX still applies on each hop.

### B2030B-F04 — Edge: Vertical tabs, Collections, Workspaces
- **Source:** Microsoft Edge (vertical tabs, Collections, Workspaces, sleeping tabs).
- **Target:** `ui/shell-desktop/src/spaces.ts` (extend), `ui/shell-desktop/src/side-panel.ts`.
- **Spec sketch:** First-class **vertical tab strip**, **Collections** (drag
  pages/snippets into a saved set), shareable **Workspaces**, and **sleeping
  tabs** (discard idle tabs to reclaim memory, tracked against perf budgets).
- **Acceptance:** vertical/horizontal toggle persists per space; collections
  export/import as JSON; sleeping tabs reduce RSS measurably in `perf.yml`.

### B2030B-F05 — Brave: Shields (ad/tracker blocking) + onion windows
- **Source:** Brave (Shields, fingerprint randomization, Tor private windows).
- **Target:** `engine/net/src/shields.rs` (new), reuse `fingerprint.rs`, onion in `protocols/`.
- **Spec sketch:** Native **Shields** content/ad/tracker blocking with per-site
  toggles and aggressiveness levels, fingerprint farbling, and **onion-routed
  private windows**. **No crypto-token/ads-reward economics** (avoids *Riba*; see
  ML-1.0 §1.3) — Shields ships ad-free.
- **Acceptance:** Shields blocks a known tracker corpus; per-site override works;
  onion window resolves a `.onion` test service; no token/wallet code paths.

### B2030B-F06 — Opera: Policy-gated VPN + sidebar apps + battery saver
- **Source:** Opera (built-in VPN, integrated messengers, battery saver, workspaces).
- **Target:** `engine/net/src/vpn.rs` (new), `ui/shell-desktop/src/side-panel.ts`, `engine/gpu/src/energy.rs`.
- **Spec sketch:** Optional **VPN/proxy profile** (admin-gated, with a clear,
  honest "this routes traffic through X" disclosure per *Shafafiyah*), pinnable
  **sidebar web-apps**, and a **battery saver** that throttles background tabs
  and animation (ties into the Energy Dashboard §8).
- **Acceptance:** VPN toggle changes egress IP in test; disclosure UI shown
  before first use; battery-saver lowers measured energy in `perf.yml`.

### B2030B-F07 — Vivaldi: Deep customization + tab tiling + notes/mail
- **Source:** Vivaldi (UI customization, tab stacking/tiling, built-in notes/mail/calendar/feeds).
- **Target:** `ui/shell-desktop/src/customize/` (new), reuse `layouts.ts`, `ui/reader/`.
- **Spec sketch:** Theme/layout editor (move toolbars, custom keyboard shortcuts,
  mouse gestures), **tab stacking + tiling** (built on existing `splitPanes`),
  and lightweight built-in **Notes** + **Feed reader**. Mail/calendar deferred to
  sidebar web-apps (F06) to avoid scope creep.
- **Acceptance:** layout edits persist and export; tab tiling reuses
  `layouts.ts` presets; notes stored encrypted at rest with the profile key.

### B2030B-F08 — Arc: Command bar, spaces, split view, boosts/easels
- **Source:** Arc / The Browser Company (command bar, spaces, split view, boosts, easels).
- **Target:** `ui/command-palette/` (extend), `ui/shell-desktop/src/layouts.ts`, `ui/themes/`.
- **Spec sketch:** We already have a command palette and split layouts; add
  **per-site "boosts"** (user CSS/JS overrides via `userContent.css` +
  capability-scoped script injection) and a lightweight **easel** (canvas of
  pinned page snippets). Boosts are sandboxed and policy-gated.
- **Acceptance:** boost CSS applies to its origin only; boost JS runs in an
  isolated world with no extra capabilities; easel persists per space.

### B2030B-F09 — Tor: Anonymity-by-default hardened profile
- **Source:** Tor Browser (onion routing default, fingerprint resistance, no-JS levels, letterboxing).
- **Target:** `engine/blink-integration/src/fingerprint.rs`, `engine/net/src/protocols/`, new `profiles/hardened`.
- **Spec sketch:** A **"Maximum Privacy" profile** preset: onion routing on,
  aggressive fingerprint resistance (letterboxing, locale/timezone spoofing,
  font enumeration limits), security-level slider (Standard/Safer/Safest), and
  per-origin privacy budget at its strictest.
- **Acceptance:** profile passes a fingerprint-uniqueness regression below a set
  entropy threshold; security-level slider disables JIT/JS per level; default
  egress is onion-routed in this profile.

### B2030B-F10 — DuckDuckGo: Fire Button burn + email/alias relay
- **Source:** DuckDuckGo Browser (Fire Button, Email Protection, App Tracking Protection, Duck Player).
- **Target:** `ui/shell-desktop/src/burn.ts` (new), `engine/net/src/email_relay.rs` (new).
- **Spec sketch:** One-click **Burn** (instantly clear tabs, history, cookies,
  cache for the session or a chosen scope), **email alias relay** (generate
  per-site forwarding aliases that strip trackers), and a private video player
  ("clean embed") mode. Burn is irreversible and clearly confirmed (*Sidq*).
- **Acceptance:** burn removes all targeted state verified by integration test;
  aliases forward and strip tracking pixels; clean-embed blocks third-party
  cookies on video embeds.

---

## Triage notes

- **Already partially built (extend, don't rebuild):** F01 (Copilot §1), F04/F07/F08
  (spaces, layouts, command palette, themes already exist), F09 (privacy budget,
  fingerprint), F05/F06 onion + protocol handlers (`engine/net/src/protocols/`).
- **Net-new modules:** `shields.rs`, `partition.rs`, `relay.rs`, `vpn.rs`,
  `email_relay.rs`, `burn.ts`, `customize/`, hardened profile.
- **Ethics gates (ML-1.0 Part C):** F03/F05/F06 (relay/VPN) must disclose trust
  model (*Shafafiyah*); F05 must avoid token economics (*Riba*); F10 burn must be
  honestly confirmed and truly irreversible (*Sidq*, *Amanah*).
- **Sequencing:** privacy-foundation first (F02 → F09 → F05), then network relays
  (F03 → F06), then UX suites (F04 → F07 → F08), AI last for stability (F01),
  DDG burn/alias (F10) any time.

## References

- [Model Context Protocol] https://modelcontextprotocol.io
- [W3C DID Core] https://www.w3.org/TR/did-core/
- [W3C Verifiable Credentials] https://www.w3.org/TR/vc-data-model-2.0/
- [C2PA] https://c2pa.org
- [NIST FIPS 203/204] ML-KEM / ML-DSA.
- [RFC 9794] PQ hybrid KEX terminology.
- [Firefox Total Cookie Protection] https://blog.mozilla.org/security/total-cookie-protection/
- [Safari iCloud Private Relay] https://support.apple.com/en-us/102602
- [MASQUE / CONNECT-UDP] https://datatracker.ietf.org/wg/masque/about/
- [Tor Browser design] https://2019.www.torproject.org/projects/torbrowser/design/

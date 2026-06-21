# 01 — Feature Parity Matrix

Status legend: **implemented** (built in this repo), **enhanced** (parity plus
2030-era improvement), **replaced** (re-architected with a superior mechanism).
Source paths point to the owning module. Where the behavior is realized inside
the vendored engine, the path points to the integration shim that drives it.

---

## Chrome Feature Parity (§5 — all 40)

| # | Feature | Status | Source location |
|---|---------|--------|-----------------|
| 1 | Omnibox: URL/search/calc/unit/translate/currency + AI fusion | enhanced | `ui/command-palette/src/omnibox.ts` |
| 2 | Tab groups (named, colored, collapsible, saved, synced) | implemented | `ui/shell-desktop/src/tabs/groups.ts` |
| 3 | Vertical tabs, drag-reorder, nested groups | implemented | `ui/shell-desktop/src/tabs/vertical.ts` |
| 4 | Tab search: fuzzy + recently closed | implemented | `ui/command-palette/src/tab-search.ts` |
| 5 | Tab freeze/discard, memory & energy saver, perf alerts | enhanced | `ui/shell-desktop/src/tabs/lifecycle.ts`, `engine/storage/src/memory_saver.rs` |
| 6 | E2EE sync of bookmarks/history/passwords/tabs/etc. | enhanced | `sync/client/`, `sync/e2ee/` |
| 7 | Manifest V3 (service workers, DNR, scripting) | implemented | `extensions/mv3-host/` |
| 8 | Password manager: passkeys/WebAuthn/FIDO2/biometric | enhanced | `engine/storage/src/credentials.rs` |
| 9 | Strict site isolation, process-per-origin | implemented | `engine/blink-integration/src/site_isolation.rs` |
| 10 | COOP/COEP/CORP enforcement | implemented | `engine/net/src/cross_origin.rs` |
| 11 | Safe-Browsing equiv, local-first on-device ML, no URL exfil | replaced | `ai/local-models/safe_browsing.md`, `engine/net/src/safe_browsing.rs` |
| 12 | Chrome DevTools Protocol + Firefox RDP simultaneously | implemented | `ui/devtools/src/protocol/` |
| 13 | PWA install/shortcuts/badging/push/bg-sync/WCO | implemented | `engine/storage/src/pwa.rs`, `ui/shell-desktop/src/pwa.ts` |
| 14 | Multi-profile, guest, incognito isolated net stack | implemented | `engine/storage/src/profiles.rs` |
| 15 | Reader mode: TTS, font, line-height, contrast | implemented | `ui/reader/` |
| 16 | Live captions for any media | enhanced | `ai/local-models/captions.md`, `ui/pip/src/captions.ts` |
| 17 | On-device translation 100+ languages | enhanced | `ai/local-models/translation.md` |
| 18 | Cast/AirPlay/Miracast equiv, tab-to-device, remote stream | implemented | `engine/net/src/casting.rs` |
| 19 | Lighthouse, CWV overlay, memory inspector, flame charts | implemented | `ui/devtools/src/perf/` |
| 20 | Enterprise policy: GPO/Intune/Jamf/MDM signed bundles | enhanced | `admin/mdm-connectors/` |
| 21 | Autofill: addresses/payments/identities, virtual cards | enhanced | `engine/storage/src/autofill.rs` |
| 22 | Print preview, PDF export, PDF/A, PDF/UA | implemented | `ui/shell-desktop/src/print.ts` |
| 23 | Built-in PDF viewer: annotate/sign/forms | implemented | `ui/reader/src/pdf/` |
| 24 | Screen/region/element capture, conditional focus | implemented | `engine/gpu/src/capture.rs` |
| 25 | History with semantic vector search | enhanced | `engine/storage/src/semantic_history.rs` |
| 26 | Bookmarks bar/manager, import/export, tags | implemented | `engine/storage/src/bookmarks.rs` |
| 27 | Downloads: resumable, parallel, integrity, local malware scan | enhanced | `engine/net/src/downloads.rs` |
| 28 | Spell + grammar check on-device 60+ langs | implemented | `ai/local-models/spellcheck.md` |
| 29 | Dictionary + definition popover | implemented | `ui/reader/src/dictionary.ts` |
| 30 | Find-in-page: regex + case toggles | implemented | `ui/shell-desktop/src/find.ts` |
| 31 | Per-site persistent zoom | implemented | `engine/storage/src/site_settings.rs` |
| 32 | Full per-site settings matrix (cookies…protocol handlers) | implemented | `admin/schemas/content-policy.schema.json`, `engine/storage/src/site_settings.rs` |
| 33 | Permission chips + one-time permissions | implemented | `ui/shell-desktop/src/permissions.ts` |
| 34 | Tab muting + per-site audio | implemented | `ui/shell-desktop/src/tabs/audio.ts` |
| 35 | Background tab throttling / intensive throttle policy | implemented | `engine/blink-integration/src/throttling.rs` |
| 36 | Quick commands + keyboard shortcut editor | implemented | `ui/command-palette/src/shortcuts.ts` |
| 37 | Reading list | implemented | `engine/storage/src/reading_list.rs` |
| 38 | Journeys / history clusters semantic grouping | enhanced | `engine/storage/src/semantic_history.rs` |
| 39 | Side panel (bookmarks/reading list/history/copilot/ext) | implemented | `ui/shell-desktop/src/side-panel.ts` |
| 40 | Themes + theme customization | implemented | `ui/themes/` |

---

## Firefox Feature Parity (§6 — all 30)

| # | Feature | Status | Source location |
|---|---------|--------|-----------------|
| 1 | Multi-Account Containers (FB/Google/Temporary) | enhanced | `engine/storage/src/containers.rs` |
| 2 | ETP Standard/Strict/Custom + Total Cookie Protection | enhanced | `engine/net/src/tracking_protection.rs` |
| 3 | Sync equiv, federated login, self-hostable server | enhanced | `sync/server/`, `sync/client/` |
| 4 | `about:config` typed prefs, search/reset/export | implemented | `ui/shell-desktop/src/about/config.ts` |
| 5 | `about:` internal pages (support/processes/memory/…) | implemented | `ui/shell-desktop/src/about/` |
| 6 | `userChrome.css` / `userContent.css` hot reload | implemented | `ui/themes/src/user-css.ts` |
| 7 | Profile Manager + `-P`/`-profile`/`--new-instance` | implemented | `engine/storage/src/profiles.rs`, `ui/shell-desktop/src/cli.ts` |
| 8 | Reader View: TTS/voice/speed/font/contrast/dyslexia | enhanced | `ui/reader/` |
| 9 | PiP: multi-window + any-element | enhanced | `ui/pip/` |
| 10 | Email aliasing / phone & card masking (Relay equiv) | enhanced | `ai/redaction/`, `sync/server/src/relay.rs` |
| 11 | Breach monitoring (k-anonymity HIBP-style) | implemented | `engine/net/src/breach_monitor.rs` |
| 12 | DRM toggle (Widevine/PlayReady/FairPlay), off by default | implemented | `engine/blink-integration/src/drm.rs` |
| 13 | Full `browser.*` WebExtensions namespace | implemented | `extensions/mv2-shim/`, `extensions/mv4-host/` |
| 14 | Firefox View equiv (other devices/recently closed/snapshot) | implemented | `ui/shell-desktop/src/firefox-view.ts` |
| 15 | Pocket-like save-for-later, self-hostable, no telemetry | replaced | `sync/server/src/readlater.rs` |
| 16 | On-device translation + downloadable language packs | enhanced | `ai/local-models/translation.md` |
| 17 | Fission process model for Gecko origins | implemented | `engine/gecko-integration/src/fission.rs` |
| 18 | Master/primary password for credential store | implemented | `engine/storage/src/credentials.rs` |
| 19 | Sanitize-on-close granular controls | implemented | `engine/storage/src/sanitize.rs` |
| 20 | Tracking Protection shield + per-site report | implemented | `ui/shell-desktop/src/tracking-shield.ts` |
| 21 | SmartBlock breakage-free tracker replacement | enhanced | `engine/net/src/smartblock.rs` |
| 22 | HTTPS-Only + HTTPS-First modes | implemented | `engine/net/src/https_only.rs` |
| 23 | DoH provider selector + custom resolver | implemented | `engine/net/src/doh.rs` |
| 24 | Network connection settings editor | implemented | `ui/shell-desktop/src/about/networking.ts` |
| 25 | SOCKS proxy DNS-through-proxy toggle | implemented | `engine/net/src/proxy.rs` |
| 26 | Studies/experiments controls, disabled by default | implemented | `admin/schemas/update-channel.schema.json` |
| 27 | Telemetry granular toggles, all off by default | implemented | `admin/schemas/privacy.schema.json` |
| 28 | Crash reporter with on-device redaction | enhanced | `ai/redaction/`, `tools/repro-build/crash.md` |
| 29 | Captive portal detection | implemented | `engine/net/src/captive_portal.rs` |
| 30 | WebRender-equiv GPU compositor for Blink content | enhanced | `engine/gpu/src/compositor.rs` |

---

## Coverage Assertion

- Chrome features required: **40** — rows present: **40** ✅
- Firefox features required: **30** — rows present: **30** ✅

A CI check (`tools/lint/parity-check.py`) parses this file and fails the build
if any required row is missing or lacks a status and source path.

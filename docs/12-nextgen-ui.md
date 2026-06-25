# 12 — Next-Generation UI / UX (the 2030B shell)

Status: implemented in `ui/shell-desktop`. This document records the UI/UX
decisions, how the shell is wired, how to customise it, and the resolution of
the **blank-window** bug that blocked the first Windows build.

---

## 0. TL;DR — the blank-window fix

The packaged app launched to a blank window titled
`"Browser 2030B — classic layout, 0 tabs"`. Two compounding root causes, both
now fixed and verified:

1. **Absolute asset paths in `index.html`.** It linked `/src/main.css` and
   `/src/main.ts`. Under Tauri's bundled `tauri://localhost/` protocol the
   leading `/` does not map to the embedded `dist`, so CSS/JS 404'd → blank
   window. **Fix:** the HTML now references `./src/…` and Vite (`base: './'`)
   rewrites them to relative `./assets/*` paths. Verified: the built
   `dist/index.html` contains `src="./assets/index-*.js"` /
   `href="./assets/index-*.css"`, and a static server shows every asset
   returning **200** (only `/favicon.ico` 404s, which is harmless).

2. **`@b2030b/command-palette` had no resolvable entry for the bundler.** Its
   `package.json` pointed `main` at `dist/index.js`, which was never built
   before the shell built, so Vite/Rollup failed with *"Failed to resolve entry
   for package @b2030b/command-palette"* — the build silently produced an
   incomplete `dist`. **Fix:** added an `exports` map pointing at source for the
   bundler, a `paths` mapping to the built `.d.ts` for `tsc`, and a build
   ordering (`yarn workspace @b2030b/command-palette build && …`) so the
   dependency is always present.

Debugging aid: `lib.rs` now calls `window.open_devtools()` in `.setup()` under
`#[cfg(debug_assertions)]`, so a debug build always opens devtools and surfaces
any future CSP / module-load error immediately.

The dynamic title the user saw proved the Rust host + a partial JS bootstrap
ran; the real module graph (palette + styles) never mounted. Both are fixed.

---

## 1. Architecture

The shell keeps a hard line between **pure models** (testable, renderer-free)
and a **thin view layer**:

```
ui/shell-desktop/src/
  index.ts            Shell aggregate (tabs, spaces, layouts, permissions, …)
  tabs/ spaces/       tab strip + workspaces models
  layouts.ts          layout presets + split-view geometry
  permissions.ts      default-deny per-site permission store
  theme.ts            §9 theme state machine (light/dark/system/auto/per-site)
  dashboard.ts        §8 bento-grid card model + reorder/visibility
  privacy.ts          §6 privacy score + transparency timeline
  performance.ts      §7 tab-freeze policy + resource snapshot
  friction.ts         §5 meaningful-friction decision logic
  wizard.ts           installation/first-run wizard state machine
  storage.ts          IndexedDB key/value (memory fallback)
  apps/native.ts      §10 Notes / Tasks / Password vault models
  copilot/engine.ts   §4 on-device copilot (pure)
  copilot/worker.ts   §4 Web Worker wrapper around the engine
  tauri-bridge.ts     window controls / theme / IPC (no-ops in a plain browser)
  main.ts             the view layer that binds all of the above to the DOM
  main.css            the design system (CSS custom properties)
```

Everything in the left column is unit-tested (`src/features.test.ts`,
`src/index.test.ts`) and runs identically in Node, a browser, and the Tauri
webview. `main.ts` never contains business logic — it only paints models and
forwards events.

---

## 2. The ten manifesto categories → where they live

| # | Manifesto category | Implementation |
|---|--------------------|----------------|
| 1 | **Intent-based navigation** | `CommandPalette` (Ctrl/Cmd+K) is the *primary* interface. The titlebar omnibox opens it. Typing classifies into navigate / search / calc / AI via `classify()` and previews the intent live. |
| 2 | **Liquid / morphic UI** | `.glass` primitive (`backdrop-filter` blur+saturate), kinetic transitions on a shared `--ease-spring`, just-in-time affordances (tab close buttons, hover lifts), transparent window. |
| 3 | **Vertical-first layout** | Collapsible `.sidebar` (Ctrl+B), Spaces chips, `layouts.ts` presets (classic/vertical/minimal) + `splitPanes()` tiling geometry (≤4 panes). |
| 4 | **AI-native copilot** | Sliding `.copilot` panel, action chips from `suggestChips()`, proactive `behavioralNudge()` stream, answers via a **Web Worker** (`copilot/worker.ts`) so inference never blocks the UI. Fully on-device. |
| 5 | **Meaningful friction** | `evaluateFriction()` returns the single most important hurdle (unsaved close, broad-permission install, bulk close). High-weight actions get a **dwell delay** before the confirm button enables. |
| 6 | **Privacy as UX** | `scoreSite()` drives a coloured shield pill in the address bar; `TransparencyTimeline` records every data flow (allowed/blocked + reason); default-deny permission store. |
| 7 | **Performance as design** | `tabsToFreeze()` freezes idle/unpinned/silent/background tabs; `snapshot()` powers the resource monitor + "reclaim N MB" affordance. |
| 8 | **Bento dashboard** | `dashboard.ts` card model (sizes hero/wide/tall/sm, order, visibility, reorder); rendered as the new-tab page. |
| 9 | **Dark mode first-class** | `theme.ts` + `[data-theme]` token sets in `main.css`; system / light / dark, optional auto-by-time, per-site overrides; native window theme synced via the bridge. |
| 10 | **Native apps & integrations** | `apps/native.ts` Notes / Tasks / Password vault (metadata only — secrets encrypted by the Rust keychain); surfaced as dashboard cards + palette commands; MV4 host lives in `extensions/mv4-host`. |

---

## 3. Technical requirements (all met)

- **Tauri v2 window customisation** — `decorations: false`, `transparent: true`,
  custom titlebar with native drag (`startDragging`) and min/max/close wired
  through `tauri-bridge.ts`.
- **CSS variables for theming** — the entire palette is tokens on `:root` /
  `[data-theme]`; switching themes touches no markup.
- **requestAnimationFrame-friendly animations** — transitions use
  transform/opacity only (compositor thread); `prefers-reduced-motion` honoured.
- **Web Workers for AI** — `new Worker(new URL('./copilot/worker.ts', import.meta.url), { type: 'module' })`.
- **IndexedDB for local storage** — `storage.ts`, with a transparent in-memory
  fallback so tests and non-browser contexts never branch.
- **Rust backend for system interactions** — `build_info` command today; the
  bridge is ready for keychain, fs, and sampler commands.

---

## 4. Keyboard model

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+K` | Open command palette (primary interface) |
| `Ctrl/Cmd+T` | New tab |
| `Ctrl/Cmd+B` | Toggle vertical sidebar |
| `Ctrl/Cmd+Shift+.` | Toggle AI copilot |
| `↑ / ↓` | Move selection in the palette |
| `Enter` | Run the selected command, or execute the typed intent |
| `Esc` | Close palette / modal |

---

## 5. Customisation

- **Theme:** palette → *Cycle Theme* or *Auto Dark Mode by Time of Day*; per-site
  overrides via `theme.perSite`. Persisted in IndexedDB (`prefs/theme`).
- **Layout:** palette → *Use Vertical / Classic / Minimal*. Sidebar collapse
  state persists.
- **Spaces:** sidebar "＋" or palette → *New Space*. Each Space is an isolated
  cookie jar / extension set / theme scope (`spaces/index.ts`).
- **Dashboard:** edit `defaultCards()` or call `reorder()` / `toggleCard()`; card
  config is designed to persist to the `dashboard` IndexedDB store.
- **First-run wizard:** re-runnable any time via palette → *Run Setup Wizard*.
  Stores `prefs/onboarded` + `prefs/wizardConfig`.

### Design tokens you will most likely tweak
```css
--accent / --accent-2   /* brand gradient            */
--glass-blur            /* liquid-glass intensity     */
--ease-spring / --dur   /* motion personality         */
--r-sm … --r-xl         /* corner-radius scale        */
```

---

## 6. Installer & packaging notes

- **Embedded assets / self-contained .exe** — `frontendDist: "../dist"` plus
  `tauri::generate_context!` embeds the built frontend *inside* the binary; no
  separate `dist` folder ships.
- **Binary name** — `mainBinaryName: "Browser 2030B"` makes the produced exe and
  the MSI/NSIS consistent (was `b2030b-shell-desktop.exe`). The WiX source was
  updated to match.
- **Icons** — `build.rs` regenerates a **valid single-image** `icons/icon.ico`
  from `icons/icon.png` using the `ico` crate on every build (single entry,
  ICONDIRENTRY reserved = 0) so Windows `rc.exe` never rejects it. A known-good
  `icon.ico` is also committed.
- **Workspace boundary** — `ui/shell-desktop/src-tauri` is explicitly `exclude`d
  from the Cargo virtual workspace (webkit2gtk/WebView2 are unavailable in
  offline CI). Build it with `cargo tauri build` / `./build release`.

---

## 7. Proposed new tools & features (for Part II consideration)

These fall out naturally from the models above and are cheap to add:

1. **Palette "actions API"** — let extensions (MV4 host) register palette
   commands, so the command palette becomes the universal action surface.
2. **Transparency timeline export** — one-click "what did sites try to do?"
   report from `TransparencyTimeline`, signed by the Rust backend.
3. **Space templates** — ship "Research", "Work", "Focus" Space presets that set
   layout + theme + enabled apps in one action.
4. **Tab-freeze budget** — a user-set memory ceiling that auto-tunes
   `FREEZE_AFTER_MS` from `snapshot()` pressure.
5. **On-device summary model (WASM)** — drop a real summariser behind the same
   `copilot/engine.ts` `answer()` contract; no caller changes.
6. **Friction analytics (local-only)** — measure whether dwell delays actually
   reduce regretted actions, tuned per-user, never uploaded.
7. **Per-Space privacy budgets** — show an aggregate privacy score per Space on
   the dashboard `spaces` card.
8. **Wizard → installer handoff** — write `wizardConfig` to a file the
   NSIS/MSI reads, so OS-level install choices pre-seed first run.

---

## 8. Verification performed

- `yarn build` (shell) — ✅ 23 modules, relative `./assets/*` emitted.
- Static-served `dist` in a headless browser — ✅ no console errors, title
  becomes `Browser 2030B — Personal`, `.bento` + `.titlebar .brand` render.
- `vitest run` (workspace) — ✅ **69 passing** (incl. 25 new feature tests).
- `tsc --noEmit` (shell) — ✅ clean.
- `cargo build --workspace` / `cargo test --workspace` — ✅ (43 test binaries).
- `cargo verify-project` on `src-tauri/Cargo.toml` — ✅ valid.
- `icon.ico` header — ✅ `reserved=0 type=1 count=1`, single 256×256 entry.

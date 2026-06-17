# 06 — UI/UX Specification

## 1. Desktop Shell

- **Framework:** Tauri 2.x with a TypeScript strict-mode UI compiled with Vite.
- **Single binary.** The system webview is **not** used — the forked Blink
  engine renders the chrome itself for consistency and security.
- **Source:** `ui/shell-desktop/`.

## 2. Layout Presets

Three presets, switchable live, per-profile and per-space:

| Preset | Inspiration | Source |
|--------|-------------|--------|
| **Classic** | Chrome-like (horizontal tabs on top) | `ui/shell-desktop/src/layouts/classic.ts` |
| **Vertical** | Arc/Edge-like (vertical tab rail) | `ui/shell-desktop/src/layouts/vertical.ts` |
| **Minimal** | Safari-like (collapsing chrome) | `ui/shell-desktop/src/layouts/minimal.ts` |

## 3. Themes

Dark, light, auto, high-contrast, dyslexia-friendly, plus a full custom theme
engine with `userChrome.css` and `userContent.css` (hot reload). Source:
`ui/themes/`.

```css
/* userChrome.css example — hide the new-tab button, thicken the active tab */
#new-tab-button { display: none; }
.tab[selected] { border-bottom: 3px solid var(--b2030b-accent); }
```

## 4. Command Palette

- Trigger: `Ctrl+K` / `Cmd+K`.
- Fuzzy command, tab, and history search; action runner.
- Source: `ui/command-palette/`.
- Also powers the omnibox AI-answer fusion and the keyboard-shortcut editor.

## 5. Spaces / Workspaces

- Up to **64 spaces** per profile.
- Each space has an isolated cookie jar, isolated extension set, per-space admin
  policy, and per-space theme.
- Source: `ui/shell-desktop/src/spaces/`.

## 6. Split View

- Up to **four panes** per window: horizontal, vertical, and 2×2 grid splits.
- Drag-and-drop tabs into panes.
- Source: `ui/shell-desktop/src/split-view.ts`.

## 7. Picture-in-Picture

- Any element, multi-window, persistent across navigation.
- Source: `ui/pip/`.

## 8. Gestures & Input

Touch, trackpad, stylus, and gaze input (AR devices), configurable per device.
Source: `ui/shell-desktop/src/input/gestures.ts`.

## 9. Keyboard

- Fully remappable shortcuts.
- Optional **Vim mode**.
- Accessibility quick-keys.
- Source: `ui/command-palette/src/shortcuts.ts`.

## 10. Side Panel

Bookmarks, reading list, history, AI copilot, and extensions. Source:
`ui/shell-desktop/src/side-panel.ts`.

## 11. Accessibility (cross-reference §13)

- WCAG 2.2 **AA** across the entire UI; **AAA** for omnibox, downloads,
  permissions, reader mode, and the admin layer.
- Full screen-reader support: NVDA, JAWS, VoiceOver, TalkBack, Orca.
- Keyboard-only parity with mouse for every feature.
- Source: `ui/shell-desktop/src/a11y/`.

## 12. Internationalization

60+ locales at launch, ICU MessageFormat, full RTL, vertical CJK scripts where
relevant. Source: `ui/shell-desktop/src/i18n/`.

## 13. Component Inventory (selected)

| Component | Source |
|-----------|--------|
| Omnibox | `ui/command-palette/src/omnibox.ts` |
| Tab strip (horizontal/vertical) | `ui/shell-desktop/src/tabs/` |
| Tab groups | `ui/shell-desktop/src/tabs/groups.ts` |
| Permission chip | `ui/shell-desktop/src/permissions.ts` |
| Tracking shield | `ui/shell-desktop/src/tracking-shield.ts` |
| Downloads panel | `ui/shell-desktop/src/downloads.ts` |
| `about:` pages | `ui/shell-desktop/src/about/` |
| Reader view | `ui/reader/` |
| DevTools | `ui/devtools/` |

## 14. Visual Design Tokens

Design tokens live in `ui/themes/tokens.json` and are consumed by both the
chrome UI and `userContent.css`. Tokens cover color, spacing, radius, motion
(respecting `prefers-reduced-motion`), and typography (including a dyslexia
font stack).

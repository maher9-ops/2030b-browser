/**
 * Browser 2030B — renderer entrypoint.
 *
 * Binds the pure, testable shell models (./index.js and friends) to the DOM
 * chrome described in the UI/UX manifesto:
 *   §1 command palette (primary interface)   §6 privacy-as-UX
 *   §2 liquid/morphic glass + kinetic motion  §7 performance (freeze/monitor)
 *   §3 vertical sidebar + Spaces + tiling      §8 bento new-tab dashboard
 *   §4 AI copilot overlay (Web Worker)         §9 dark mode first-class
 *   §5 meaningful friction                     §10 native apps
 *
 * All heavy logic lives in the imported models; this file is the view layer.
 */

import { Shell } from './index.js';
import { CommandPalette, classify, type Command } from '@b2030b/command-palette';
import { effectiveTheme, cycleMode, DEFAULT_THEME, type ThemeState } from './theme.js';
import { defaultCards, layoutCards, spanClass, type BentoCard } from './dashboard.js';
import { scoreSite, type SitePrivacy } from './privacy.js';
import { snapshot, type TabActivity } from './performance.js';
import { evaluateFriction, type FrictionPrompt } from './friction.js';
import { NotesApp, TasksApp } from './apps/native.js';
import { SetupWizard } from './wizard.js';
import { openStore } from './storage.js';
import {
  isTauri,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  startDragging,
  setNativeTheme,
  buildInfo,
} from './tauri-bridge.js';
import type { CopilotContext, ActionChip, StreamItem } from './copilot/engine.js';
import { answer as localAnswer, suggestChips, behavioralNudge } from './copilot/engine.js';

/* ------------------------------------------------------------------ helpers */

const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  }
  for (const c of children) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
};

const icon = (glyph: string, title = ''): HTMLElement =>
  h('span', { class: 'r-icon', 'aria-hidden': 'true', title }, [glyph]);

/* ----------------------------------------------------------- copilot client */

/**
 * Talks to the copilot Web Worker when available, falling back to the local
 * engine synchronously (tests / no-worker environments).
 */
class CopilotClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, (v: unknown) => void>();

  constructor() {
    try {
      this.worker = new Worker(new URL('./copilot/worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent): void => {
        const { id, ...rest } = e.data as { id: number };
        this.pending.get(id)?.(rest);
        this.pending.delete(id);
      };
    } catch {
      this.worker = null;
    }
  }

  async ask(query: string, ctx: CopilotContext): Promise<StreamItem> {
    if (!this.worker) return localAnswer(query, ctx);
    return this.call<{ item: StreamItem }>({ kind: 'ask', query, ctx }).then((r) => r.item);
  }
  async chips(ctx: CopilotContext): Promise<ActionChip[]> {
    if (!this.worker) return suggestChips(ctx);
    return this.call<{ chips: ActionChip[] }>({ kind: 'chips', ctx }).then((r) => r.chips);
  }
  async nudge(ctx: CopilotContext): Promise<StreamItem | null> {
    if (!this.worker) return behavioralNudge(ctx);
    return this.call<{ item: StreamItem | null }>({ kind: 'nudge', ctx }).then((r) => r.item);
  }

  private call<T>(msg: object): Promise<T> {
    const id = ++this.seq;
    return new Promise<T>((resolve) => {
      this.pending.set(id, resolve as (v: unknown) => void);
      this.worker!.postMessage({ id, ...msg });
    });
  }
}

/* -------------------------------------------------------------------- toast */

function toast(root: HTMLElement, msg: string): void {
  let host = root.querySelector<HTMLElement>('.toasts');
  if (!host) {
    host = h('div', { class: 'toasts' });
    root.append(host);
  }
  const t = h('div', { class: 'toast' }, [msg]);
  host.append(t);
  setTimeout(() => t.remove(), 2600);
}

/* --------------------------------------------------------------------- App */

class App {
  private readonly palette = new CommandPalette();
  private readonly handlers = new Map<string, () => void>();
  private readonly copilot = new CopilotClient();
  private readonly notes = new NotesApp();
  private readonly tasks = new TasksApp();
  private readonly prefs = openStore('prefs');

  private theme: ThemeState = { ...DEFAULT_THEME };
  private sidebarCollapsed = false;
  private copilotOpen = false;
  private activeSpace = 'Personal';
  private spaces = ['Personal', 'Work', 'Research'];
  private activeTabId: string | null = null;
  private version = '0.1.0';

  // DOM refs assigned in build()
  private root!: HTMLElement;
  private statusEl!: HTMLElement;
  private sidebarEl!: HTMLElement;
  private viewportEl!: HTMLElement;
  private overlayEl!: HTMLElement;
  private paletteInput!: HTMLInputElement;
  private intentEl!: HTMLElement;
  private resultsEl!: HTMLElement;
  private copilotEl!: HTMLElement;
  private copilotStream!: HTMLElement;
  private copilotChips!: HTMLElement;
  private modalRoot!: HTMLElement;
  private selectedResult = 0;

  constructor(private readonly shell: Shell) {}

  async start(root: HTMLElement): Promise<void> {
    this.root = root;
    await this.loadPrefs();
    this.registerCommands();
    this.build();
    this.applyTheme();
    this.bindKeys();

    const info = await buildInfo();
    if (info) this.version = info.version;

    // First-run: show the setup wizard unless we've completed it before.
    const done = await this.prefs.get<boolean>('onboarded');
    if (!done) this.openWizard();

    this.renderDashboard();
    this.scheduleNudges();
    root.removeAttribute('aria-busy');
  }

  /* ----------------------------------------------------------- preferences */

  private async loadPrefs(): Promise<void> {
    const saved = await this.prefs.get<ThemeState>('theme');
    if (saved) this.theme = saved;
    const collapsed = await this.prefs.get<boolean>('sidebarCollapsed');
    if (typeof collapsed === 'boolean') this.sidebarCollapsed = collapsed;
  }
  private async savePrefs(): Promise<void> {
    await this.prefs.set('theme', this.theme);
    await this.prefs.set('sidebarCollapsed', this.sidebarCollapsed);
  }

  /* -------------------------------------------------------------- commands */

  private registerCommands(): void {
    const add = (cmd: Command, run: () => void): void => {
      this.palette.register(cmd);
      this.handlers.set(cmd.id, run);
    };

    add({ id: 'new-tab', label: 'New Tab', shortcut: 'Ctrl+T' }, () => this.newTab());
    add({ id: 'new-tab-home', label: 'New Tab — Dashboard' }, () => {
      this.newTab('about:home', 'New Tab');
      this.renderDashboard();
    });
    add({ id: 'layout-vertical', label: 'Use Vertical Tabs' }, () => {
      this.shell.setLayout('vertical');
      toast(this.root, 'Vertical layout');
    });
    add({ id: 'layout-classic', label: 'Use Classic Layout' }, () => this.shell.setLayout('classic'));
    add({ id: 'layout-minimal', label: 'Use Minimal (focus) Layout' }, () => this.shell.setLayout('minimal'));
    add({ id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B' }, () => this.toggleSidebar());
    add({ id: 'copilot', label: 'Open AI Copilot', shortcut: 'Ctrl+Shift+.' }, () => this.toggleCopilot(true));
    add({ id: 'theme-cycle', label: 'Cycle Theme (System / Light / Dark)' }, () => this.cycleTheme());
    add({ id: 'theme-auto', label: 'Auto Dark Mode by Time of Day' }, () => {
      this.theme = { ...this.theme, autoByTime: !this.theme.autoByTime };
      this.applyTheme();
      void this.savePrefs();
      toast(this.root, `Auto dark mode ${this.theme.autoByTime ? 'on' : 'off'}`);
    });
    add({ id: 'freeze-idle', label: 'Freeze Idle Tabs (reclaim memory)' }, () => this.freezeIdle());
    add({ id: 'resource-monitor', label: 'Open Resource Monitor' }, () => this.openResourceMonitor());
    add({ id: 'new-space', label: 'New Space / Workspace' }, () => this.promptNewSpace());
    add({ id: 'notes', label: 'Open Notes' }, () => this.openNotesApp());
    add({ id: 'tasks', label: 'Open Tasks' }, () => this.openTasksApp());
    add({ id: 'passwords', label: 'Open Password Manager' }, () => toast(this.root, 'Vault unlocked (demo)'));
    add({ id: 'privacy', label: 'Open Privacy & Transparency' }, () => this.openPrivacyPanel());
    add({ id: 'setup-wizard', label: 'Run Setup Wizard' }, () => this.openWizard());
    add({ id: 'split-view', label: 'Split View (side-by-side)' }, () => this.splitView());
  }

  /* ----------------------------------------------------------------- build */

  private build(): void {
    const shellEl = h('div', { class: 'shell' });

    /* Titlebar with intent-first omnibox (§1) + privacy pill (§6) */
    const omni = h('button', { class: 'omni', id: 'omni', title: 'Ask anything or type a URL (Ctrl+K)' }, [
      h('span', { class: 'priv good', id: 'priv-pill' }, ['shield 100']),
      h('span', { class: 'grow' }, ['Ask anything, or type a URL…']),
      h('span', { class: 'kbd' }, ['Ctrl K']),
    ]);
    omni.addEventListener('click', () => this.openPalette());

    const titlebar = h('div', { class: 'titlebar' }, [
      h('span', { class: 'brand' }, ['Browser 2030', (() => { const s = h('span'); s.textContent = 'B'; return s; })()]),
      h('button', { class: 'icon-btn no-drag', title: 'Toggle sidebar (Ctrl+B)' }, ['☰']),
      omni,
      h('button', { class: 'icon-btn no-drag', id: 'copilot-btn', title: 'AI Copilot' }, ['✦']),
      this.windowButtons(),
    ]);
    (titlebar.querySelector('.icon-btn') as HTMLElement).addEventListener('click', () => this.toggleSidebar());
    (titlebar.querySelector('#copilot-btn') as HTMLElement).addEventListener('click', () => this.toggleCopilot());
    // Native drag on the titlebar background (custom titlebar w/ decorations:false).
    titlebar.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('.no-drag')) return;
      if (isTauri()) void startDragging();
    });

    /* Sidebar (§3) */
    this.sidebarEl = h('div', { class: `sidebar${this.sidebarCollapsed ? ' collapsed' : ''}` });

    /* Main viewport (§7/§8) */
    this.viewportEl = h('div', { class: 'viewport' });
    this.statusEl = h('div', { id: 'status', class: 'hidden' });
    const main = h('div', { class: 'main' }, [this.viewportEl, this.statusEl]);

    shellEl.append(titlebar, this.sidebarEl, main);

    /* Command palette overlay (§1) */
    this.paletteInput = h('input', {
      type: 'text',
      placeholder: 'Type a command, search, calculation, or URL…',
      'aria-label': 'Command palette',
    });
    this.intentEl = h('div', { class: 'intent', hidden: '' });
    this.resultsEl = h('div', { class: 'results' });
    const palette = h('div', { class: 'palette' }, [this.paletteInput, this.intentEl, this.resultsEl]);
    this.overlayEl = h('div', { class: 'overlay', hidden: '' }, [palette]);
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.closePalette();
    });
    this.paletteInput.addEventListener('input', () => this.renderResults());

    /* Copilot panel (§4) */
    this.copilotStream = h('div', { class: 'stream' });
    this.copilotChips = h('div', { class: 'actionchips chips' });
    const composerInput = h('input', { type: 'text', placeholder: 'Ask the copilot…', 'aria-label': 'Copilot prompt' });
    const send = h('button', {}, ['Send']);
    const submit = (): void => {
      const q = composerInput.value.trim();
      if (!q) return;
      composerInput.value = '';
      this.askCopilot(q);
    };
    send.addEventListener('click', submit);
    composerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    this.copilotEl = h('div', { class: 'copilot' }, [
      h('header', {}, [h('span', { class: 'dot' }), h('h3', {}, ['Copilot']), h('span', { class: 'grow' }),
        (() => { const b = h('button', { class: 'icon-btn', title: 'Close' }, ['✕']); b.addEventListener('click', () => this.toggleCopilot(false)); return b; })()]),
      this.copilotStream,
      this.copilotChips,
      h('div', { class: 'composer' }, [composerInput, send]),
    ]);

    /* Modal host (friction / wizard / apps) */
    this.modalRoot = h('div', { class: 'modal-root', hidden: '' });
    this.modalRoot.addEventListener('click', (e) => { if (e.target === this.modalRoot) this.closeModal(); });

    this.root.replaceChildren(shellEl, this.overlayEl, this.copilotEl, this.modalRoot);
    this.renderSidebar();
    this.updateStatus();
  }

  private windowButtons(): HTMLElement {
    const mk = (cls: string, glyph: string, fn: () => void): HTMLElement => {
      const b = h('button', { class: `win-btn ${cls} no-drag`, 'aria-label': cls }, [glyph]);
      b.addEventListener('click', fn);
      return b;
    };
    return h('div', { class: 'win-btns no-drag' }, [
      mk('min', '—', () => void minimizeWindow()),
      mk('max', '▢', () => void toggleMaximizeWindow()),
      mk('close', '✕', () => void closeWindow()),
    ]);
  }

  /* ---------------------------------------------------------------- status */

  private updateStatus(): void {
    this.statusEl.textContent =
      `Browser 2030B — ${this.shell.layoutConfig.preset} layout, ${this.shell.tabs.tabCount} tabs`;
    // Keep the native window title meaningful (this is the string the user saw
    // on the blank window — now backed by a real, rendered UI).
    document.title = `Browser 2030B — ${this.activeSpace}`;
  }

  /* --------------------------------------------------------------- sidebar */

  private renderSidebar(): void {
    const spaces = h('div', { class: 'spaces' }, this.spaces.map((s) => {
      const b = h('button', { class: `space-chip${s === this.activeSpace ? ' active' : ''}` }, [s]);
      b.addEventListener('click', () => { this.activeSpace = s; this.renderSidebar(); this.updateStatus(); });
      return b;
    }));

    const newSpace = h('button', { class: 'icon-btn', title: 'New Space' }, ['＋']);
    newSpace.addEventListener('click', () => this.promptNewSpace());

    const tablist = h('div', { class: 'tablist', id: 'tablist' });
    this.renderTabs(tablist);

    const foot = h('div', { class: 'side-foot' }, [
      this.footBtn('✦', 'Copilot', () => this.toggleCopilot()),
      this.footBtn('🗒', 'Notes', () => this.openNotesApp()),
      this.footBtn('✓', 'Tasks', () => this.openTasksApp()),
      this.footBtn('🛡', 'Privacy', () => this.openPrivacyPanel()),
      this.footBtn('⚙', 'Settings', () => this.openWizard()),
    ]);

    this.sidebarEl.replaceChildren(
      h('div', { class: 'spaces-head' }, [h('span', {}, ['Spaces']), newSpace]),
      spaces,
      h('div', { class: 'side-section label' }, ['Tabs']),
      tablist,
      foot,
    );
    this.sidebarEl.className = `sidebar${this.sidebarCollapsed ? ' collapsed' : ''}`;
  }

  private footBtn(glyph: string, title: string, fn: () => void): HTMLElement {
    const b = h('button', { class: 'icon-btn', title }, [glyph]);
    b.addEventListener('click', fn);
    return b;
  }

  private renderTabs(container: HTMLElement): void {
    const ids = this.shell.tabs.tabOrder;
    container.replaceChildren(
      ...ids.map((id) => {
        const active = id === this.activeTabId;
        const row = h('div', { class: `tab${active ? ' active' : ''}`, 'data-id': id }, [
          h('span', { class: 'favicon' }, ['◆']),
          h('span', { class: 'title' }, [`Tab ${id.slice(0, 4)}`]),
          (() => {
            const c = h('button', { class: 'close', title: 'Close tab' }, ['✕']);
            c.addEventListener('click', (e) => { e.stopPropagation(); this.closeTab(id); });
            return c;
          })(),
        ]);
        row.addEventListener('click', () => { this.activeTabId = id; this.renderSidebar(); });
        return row;
      }),
    );
    if (ids.length === 0) {
      container.append(h('div', { class: 'side-section' }, ['No tabs — press Ctrl+T']));
    }
  }

  /* --------------------------------------------------------- palette (§1) */

  private openPalette(): void {
    this.overlayEl.removeAttribute('hidden');
    this.paletteInput.value = '';
    this.selectedResult = 0;
    this.renderResults();
    this.paletteInput.focus();
  }
  private closePalette(): void {
    this.overlayEl.setAttribute('hidden', '');
  }

  private renderResults(): void {
    const q = this.paletteInput.value;
    // Intent preview for natural-language / URL / calc input (§1).
    if (q.trim()) {
      const intent = classify(q);
      this.intentEl.removeAttribute('hidden');
      this.intentEl.replaceChildren();
      const label =
        intent.kind === 'navigate' ? ['Go to ', this.b(intent.url)]
        : intent.kind === 'calculator' ? [this.b(`${intent.expression} = ${intent.result}`)]
        : intent.kind === 'ai' ? ['Ask Copilot: ', this.b(intent.prompt)]
        : ['Search the web for ', this.b(intent.query)];
      this.intentEl.append(...label.map((x) => typeof x === 'string' ? document.createTextNode(x) : x));
    } else {
      this.intentEl.setAttribute('hidden', '');
    }

    const matches = this.palette.search(q);
    if (this.selectedResult >= matches.length) this.selectedResult = 0;
    this.resultsEl.replaceChildren(
      ...matches.map((cmd, i) => {
        const row = h('div', { class: 'result', role: 'option', 'aria-selected': String(i === this.selectedResult) }, [
          icon('▸'),
          h('span', { class: 'r-label' }, [cmd.label]),
          ...(cmd.shortcut ? [h('span', { class: 'r-shortcut' }, [cmd.shortcut])] : []),
        ]);
        row.addEventListener('click', () => this.runResult(cmd.id));
        row.addEventListener('mouseenter', () => { this.selectedResult = i; this.paintSelection(); });
        return row;
      }),
    );
  }
  private b(text: string): HTMLElement { return h('b', {}, [text]); }
  private paintSelection(): void {
    [...this.resultsEl.children].forEach((c, i) =>
      (c as HTMLElement).setAttribute('aria-selected', String(i === this.selectedResult)));
  }

  private runPaletteEnter(): void {
    const q = this.paletteInput.value;
    const matches = this.palette.search(q);
    if (matches[this.selectedResult]) {
      this.runResult(matches[this.selectedResult]!.id);
      return;
    }
    // No command matched: treat the text as an omnibox intent.
    const intent = classify(q);
    this.closePalette();
    if (intent.kind === 'navigate') { this.newTab(intent.url, intent.url); toast(this.root, `Opening ${intent.url}`); }
    else if (intent.kind === 'calculator') toast(this.root, `${intent.expression} = ${intent.result}`);
    else if (intent.kind === 'ai') { this.toggleCopilot(true); this.askCopilot(intent.prompt); }
    else { this.newTab(`search:${intent.query}`, intent.query); toast(this.root, `Searching: ${intent.query}`); }
  }

  private runResult(id: string): void {
    this.closePalette();
    this.handlers.get(id)?.();
    this.updateStatus();
  }

  /* ------------------------------------------------------------ tabs/perf */

  private newTab(url = 'about:home', title = 'New Tab'): void {
    const id = (globalThis.crypto?.randomUUID?.() ?? `t-${Math.random().toString(36).slice(2)}`);
    this.shell.tabs.addTab({ id, title, url, audible: false, muted: false, pinned: false });
    this.activeTabId = id;
    this.renderSidebar();
    this.updateStatus();
  }
  private closeTab(id: string): void {
    this.shell.tabs.closeTab(id);
    if (this.activeTabId === id) this.activeTabId = this.shell.tabs.tabOrder[0] ?? null;
    this.renderSidebar();
    this.updateStatus();
  }

  private syntheticActivity(): TabActivity[] {
    const now = Date.now();
    return this.shell.tabs.tabOrder.map((id, i) => ({
      id, lastActiveAt: now - i * 4 * 60 * 1000, pinned: false, audible: false,
      memMB: 60 + ((i * 37) % 180), cpu: ((i * 13) % 30) / 100, frozen: false,
    }));
  }
  private freezeIdle(): void {
    const snap = snapshot(this.syntheticActivity(), this.activeTabId, Date.now());
    toast(this.root, `Reclaimed ~${Math.round(snap.reclaimableMB)} MB by freezing idle tabs`);
    this.renderSidebar();
  }
  private openResourceMonitor(): void {
    const snap = snapshot(this.syntheticActivity(), this.activeTabId, Date.now());
    const rows = snap.heaviest.map((t) =>
      h('div', { class: 'resrow' }, [
        h('span', { class: 'favicon' }, ['◆']),
        h('span', {}, [`Tab ${t.id.slice(0, 4)}`]),
        h('span', { class: 'bar' }, [(() => { const s = h('span'); s.style.width = `${Math.min(100, t.memMB / 3)}%`; return s; })()]),
        h('span', { class: 'val' }, [`${Math.round(t.memMB)} MB`]),
      ]));
    this.showModal('Resource Monitor', [
      h('p', {}, [`${this.shell.tabs.tabCount} tabs · ~${Math.round(snap.totalMemMB)} MB · CPU ${Math.round(snap.totalCpu * 100)}%`]),
      h('div', { class: 'resmon' }, rows.length ? rows : [h('p', {}, ['No tabs yet.'])]),
    ], [{ label: 'Freeze idle tabs', kind: 'primary', run: () => { this.freezeIdle(); this.closeModal(); } }]);
  }

  /* --------------------------------------------------------- copilot (§4) */

  private context(): CopilotContext {
    return {
      url: 'about:home', title: `Browser 2030B — ${this.activeSpace}`,
      wordCount: 0, tabCount: this.shell.tabs.tabCount, recentOrigins: [],
    };
  }
  private async toggleCopilot(force?: boolean): Promise<void> {
    this.copilotOpen = force ?? !this.copilotOpen;
    this.copilotEl.classList.toggle('open', this.copilotOpen);
    if (this.copilotOpen) {
      if (!this.copilotStream.childElementCount) {
        this.pushBubble({ role: 'ai', text: 'Hi — I run fully on-device. Ask me to summarize, translate, calculate, or organise your tabs.' });
      }
      const chips = await this.copilot.chips(this.context());
      this.renderChips(chips);
    }
  }
  private renderChips(chips: ActionChip[]): void {
    this.copilotChips.replaceChildren(...chips.map((c) => {
      const b = h('button', { class: 'chip ai', title: c.reason }, [c.label]);
      b.addEventListener('click', () => this.askCopilot(c.label));
      return b;
    }));
  }
  private pushBubble(item: StreamItem): void {
    this.copilotStream.append(h('div', { class: `bubble ${item.role}` }, [item.text]));
    this.copilotStream.scrollTop = this.copilotStream.scrollHeight;
  }
  private async askCopilot(query: string): Promise<void> {
    this.toggleCopilot(true);
    this.pushBubble({ role: 'me', text: query });
    const item = await this.copilot.ask(query, this.context());
    this.pushBubble(item);
  }
  private scheduleNudges(): void {
    // Just-in-time behavioral stream: poll occasionally, push at most one nudge.
    setInterval(async () => {
      const n = await this.copilot.nudge(this.context());
      if (n && this.copilotOpen) this.pushBubble(n);
    }, 30_000);
  }

  /* ------------------------------------------------------------ theme (§9) */

  private applyTheme(): void {
    const env = { systemPrefersDark: globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false, hour: new Date().getHours() };
    const eff = effectiveTheme(this.theme, null, env);
    document.documentElement.setAttribute('data-theme', this.theme.mode === 'system' ? 'system' : eff);
    if (isTauri()) void setNativeTheme(eff);
  }
  private cycleTheme(): void {
    this.theme = { ...this.theme, mode: cycleMode(this.theme.mode) };
    this.applyTheme();
    void this.savePrefs();
    toast(this.root, `Theme: ${this.theme.mode}`);
  }

  /* ----------------------------------------------------- privacy (§6) pill */

  private demoPrivacy(): SitePrivacy {
    return { origin: 'about:home', trackersDetected: 12, trackersBlocked: 11, secure: true, thirdPartyCookies: 0, fingerprintingAttempts: 0 };
  }
  private refreshPrivacyPill(): void {
    const pill = this.root.querySelector<HTMLElement>('#priv-pill');
    if (!pill) return;
    const s = scoreSite(this.demoPrivacy());
    pill.className = `priv ${s.grade}`;
    pill.textContent = `shield ${s.value}`;
    pill.title = s.summary;
  }
  private openPrivacyPanel(): void {
    const s = scoreSite(this.demoPrivacy());
    this.showModal('Privacy & Transparency', [
      h('p', {}, [`Privacy score for this Space: ${s.value}/100 — ${s.summary}.`]),
      h('div', { class: 'friction-meter' }, [(() => { const sp = h('span'); sp.style.width = `${s.value}%`; return sp; })()]),
      h('p', {}, ['2030B denies trackers, third-party cookies, and fingerprinting by default. Every grant is origin-scoped and shown on the transparency timeline.']),
    ], []);
  }

  /* ------------------------------------------------------------ spaces/§3 */

  private promptNewSpace(): void {
    const input = h('input', { type: 'text', placeholder: 'Space name (e.g. Reading)' }) as HTMLInputElement;
    this.showModal('New Space', [
      h('div', { class: 'wizard' }, [h('div', { class: 'field' }, [h('label', {}, ['Name']), input])]),
    ], [{
      label: 'Create', kind: 'primary', run: () => {
        const name = input.value.trim();
        if (name) { this.spaces.push(name); this.activeSpace = name; this.renderSidebar(); this.updateStatus(); }
        this.closeModal();
      },
    }]);
    setTimeout(() => input.focus(), 50);
  }
  private splitView(): void { toast(this.root, 'Split view — drag a tab to a pane edge to tile'); }

  /* --------------------------------------------------- native apps (§10) */

  private openNotesApp(): void {
    const ta = h('textarea', { rows: '6', style: 'width:100%;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--fg);padding:10px;' }) as HTMLTextAreaElement;
    this.showModal('Notes', [
      h('p', {}, [`${this.notes.count} note(s) stored locally (IndexedDB).`]), ta,
    ], [{
      label: 'Save note', kind: 'primary', run: () => {
        const body = ta.value.trim();
        if (body) { this.notes.upsert({ id: `n-${Date.now()}`, title: body.slice(0, 24), body, updatedAt: Date.now() }); toast(this.root, 'Note saved'); }
        this.closeModal();
      },
    }]);
  }
  private openTasksApp(): void {
    const input = h('input', { type: 'text', placeholder: 'New task…' }) as HTMLInputElement;
    const list = h('div', {}, this.tasks.list().map((t) => h('div', {}, [t.done ? '✓ ' : '○ ', t.text])));
    this.showModal('Tasks', [
      h('p', {}, [`${this.tasks.openCount} open task(s).`]),
      h('div', { class: 'field' }, [input]), list,
    ], [{
      label: 'Add task', kind: 'primary', run: () => {
        const text = input.value.trim();
        if (text) { this.tasks.add({ id: `k-${Date.now()}`, text, done: false, createdAt: Date.now() }); toast(this.root, 'Task added'); }
        this.closeModal();
      },
    }]);
  }

  /* ------------------------------------------------------ dashboard (§8) */

  private renderDashboard(): void {
    const cards = layoutCards(defaultCards());
    const grid = h('div', { class: 'bento' }, cards.map((c) => this.renderCard(c)));
    this.viewportEl.replaceChildren(grid);
    this.refreshPrivacyPill();
  }

  private renderCard(c: BentoCard): HTMLElement {
    const card = h('div', { class: `card ${spanClass(c.size)}` });
    card.append(h('div', { class: 'card-title' }, [c.title]));
    switch (c.kind) {
      case 'search': {
        card.append(
          h('div', { class: 'card-big' }, ['What do you want to do?']),
          h('div', { class: 'card-body' }, ['Press Ctrl+K, or just start typing — 2030B figures out search, navigation, math, or AI.']),
          (() => { const b = h('button', { class: 'btn primary', style: 'align-self:flex-start' }, ['Open command palette']); b.addEventListener('click', () => this.openPalette()); return b; })(),
        );
        break;
      }
      case 'copilot':
        card.append(h('div', { class: 'card-body' }, ['On-device AI copilot. Summaries, translation, and tab organisation — nothing leaves your machine.']),
          (() => { const b = h('button', { class: 'btn', style: 'align-self:flex-start' }, ['Open Copilot']); b.addEventListener('click', () => this.toggleCopilot(true)); return b; })());
        break;
      case 'quicklinks':
        card.append(h('div', { class: 'quicklinks' }, ['Docs', 'Mail', 'Calendar', 'Drive', 'Repo'].map((q) => {
          const b = h('button', { class: 'quicklink' }, ['◆ ', q]);
          b.addEventListener('click', () => { this.newTab(`search:${q}`, q); toast(this.root, q); });
          return b;
        })));
        break;
      case 'privacy': {
        const s = scoreSite(this.demoPrivacy());
        card.append(h('div', { class: 'card-big' }, [String(s.value)]), h('div', { class: 'card-body' }, [s.summary]));
        break;
      }
      case 'performance': {
        const snap = snapshot(this.syntheticActivity(), this.activeTabId, Date.now());
        card.append(h('div', { class: 'card-big' }, [`${Math.round(snap.totalMemMB)}`]), h('div', { class: 'card-body' }, ['MB across tabs · click to freeze idle']));
        card.addEventListener('click', () => this.openResourceMonitor());
        break;
      }
      case 'spaces':
        card.append(h('div', { class: 'card-big' }, [String(this.spaces.length)]), h('div', { class: 'card-body' }, [this.spaces.join(' · ')]));
        break;
      case 'recent':
        card.append(h('div', { class: 'card-body' }, ['Your recent tabs appear here as you browse.']));
        break;
      case 'notes':
        card.append(h('div', { class: 'card-body' }, [`${this.notes.count} note(s). Click to add.`]));
        card.addEventListener('click', () => this.openNotesApp());
        break;
      case 'tasks':
        card.append(h('div', { class: 'card-big' }, [String(this.tasks.openCount)]), h('div', { class: 'card-body' }, ['open tasks']));
        card.addEventListener('click', () => this.openTasksApp());
        break;
    }
    return card;
  }

  /* ------------------------------------------------- friction (§5) modal */

  /** Public-ish hook the rest of the UI can call before risky actions. */
  guard(prompt: FrictionPrompt | null, proceed: () => void): void {
    if (!prompt) { proceed(); return; }
    const confirm = h('button', { class: 'btn danger' }, [prompt.confirmLabel]) as HTMLButtonElement;
    if (prompt.dwellMs > 0) {
      confirm.disabled = true;
      let left = Math.ceil(prompt.dwellMs / 1000);
      confirm.textContent = `${prompt.confirmLabel} (${left})`;
      const t = setInterval(() => {
        left -= 1;
        if (left <= 0) { clearInterval(t); confirm.disabled = false; confirm.textContent = prompt.confirmLabel; }
        else confirm.textContent = `${prompt.confirmLabel} (${left})`;
      }, 1000);
    }
    confirm.addEventListener('click', () => { this.closeModal(); proceed(); });
    this.showModalRaw([
      h('h2', {}, [prompt.title]),
      h('div', { class: 'friction-meter' }, [(() => { const s = h('span'); s.style.width = `${Math.round(prompt.weight * 100)}%`; return s; })()]),
      h('p', {}, [prompt.body]),
      h('div', { class: 'row' }, [
        (() => { const b = h('button', { class: 'btn' }, ['Cancel']); b.addEventListener('click', () => this.closeModal()); return b; })(),
        confirm,
      ]),
    ]);
  }

  /* ----------------------------------------------------- wizard (install) */

  private openWizard(): void {
    const wiz = new SetupWizard({ displayName: '' });
    const render = (): void => {
      const steps = h('div', { class: 'steps' }, Array.from({ length: wiz.total }, (_, i) =>
        h('div', { class: `step-dot${i < wiz.stepIndex ? ' done' : i === wiz.stepIndex ? ' active' : ''}` })));
      const body = this.wizardStep(wiz, render);
      const back = h('button', { class: 'btn' }, ['Back']); back.addEventListener('click', () => { wiz.back(); render(); });
      const nextLabel = wiz.isLast ? 'Finish' : 'Next';
      const next = h('button', { class: 'btn primary' }, [nextLabel]);
      next.addEventListener('click', async () => {
        if (wiz.isLast) { await this.finishWizard(wiz); return; }
        wiz.next(); render();
      });
      this.showModalRaw([
        h('div', { class: 'wizard' }, [
          steps,
          h('h2', {}, [this.wizardTitle(wiz.step)]),
          body,
          h('div', { class: 'row' }, wiz.isFirst ? [next] : [back, next]),
        ]),
      ]);
    };
    render();
  }

  private wizardTitle(step: string): string {
    return ({
      welcome: 'Welcome to Browser 2030B',
      profile: 'Set up your first Space',
      appearance: 'Make it yours',
      privacy: 'Privacy by default',
      apps: 'Built-in apps',
      done: 'You’re all set',
    } as Record<string, string>)[step] ?? '';
  }

  private wizardStep(wiz: SetupWizard, render: () => void): HTMLElement {
    const c = wiz.config;
    switch (wiz.step) {
      case 'welcome':
        return h('div', {}, [h('p', {}, ['A privacy-first, intent-driven browser. This quick setup takes under a minute and everything is stored locally.'])]);
      case 'profile': {
        const space = h('input', { type: 'text', value: c.defaultSpace }) as HTMLInputElement;
        space.addEventListener('input', () => wiz.update({ defaultSpace: space.value }));
        const name = h('input', { type: 'text', value: c.displayName, placeholder: 'Optional' }) as HTMLInputElement;
        name.addEventListener('input', () => wiz.update({ displayName: name.value }));
        return h('div', {}, [
          h('div', { class: 'field' }, [h('label', {}, ['First Space name']), space]),
          h('div', { class: 'field' }, [h('label', {}, ['Display name']), name]),
        ]);
      }
      case 'appearance': {
        const opts: [string, string, string][] = [
          ['system', 'System', 'Match your OS'],
          ['light', 'Light', 'Bright & airy'],
          ['dark', 'Dark', 'Easy on the eyes'],
        ];
        const themeGrid = h('div', { class: 'opt-grid' }, opts.map(([val, title, desc]) => {
          const o = h('label', { class: `opt${c.theme === val ? ' selected' : ''}` }, [
            h('div', {}, [h('div', { class: 'opt-title' }, [title]), h('div', { class: 'opt-desc' }, [desc])]),
          ]);
          o.addEventListener('click', () => { wiz.update({ theme: val as never }); render(); });
          return o;
        }));
        const layoutOpts: [string, string, string][] = [
          ['vertical', 'Vertical tabs', 'Recommended — scales to many tabs'],
          ['classic', 'Classic', 'Familiar horizontal tabs'],
        ];
        const layoutGrid = h('div', { class: 'opt-grid' }, layoutOpts.map(([val, title, desc]) => {
          const o = h('label', { class: `opt${c.layout === val ? ' selected' : ''}` }, [
            h('div', {}, [h('div', { class: 'opt-title' }, [title]), h('div', { class: 'opt-desc' }, [desc])]),
          ]);
          o.addEventListener('click', () => { wiz.update({ layout: val as never }); render(); });
          return o;
        }));
        return h('div', {}, [h('label', {}, ['Theme']), themeGrid, h('label', { style: 'display:block;margin-top:14px' }, ['Layout']), layoutGrid]);
      }
      case 'privacy': {
        const toggles: [keyof typeof c, string][] = [
          ['blockTrackers', 'Block trackers'],
          ['blockThirdPartyCookies', 'Block third-party cookies'],
          ['httpsOnly', 'HTTPS-only mode'],
        ];
        return h('div', { class: 'opt-grid' }, toggles.map(([key, label]) => {
          const cb = h('input', { type: 'checkbox' }) as HTMLInputElement;
          cb.checked = Boolean(c[key]);
          cb.addEventListener('change', () => wiz.update({ [key]: cb.checked } as never));
          return h('label', { class: 'opt selected' }, [cb, h('div', {}, [h('div', { class: 'opt-title' }, [label]), h('div', { class: 'opt-desc' }, ['On by default'])])]);
        }));
      }
      case 'apps': {
        const toggles: [keyof typeof c, string, string][] = [
          ['enableCopilot', 'AI Copilot', 'On-device'],
          ['enableNotes', 'Notes', 'Local notes'],
          ['enableTasks', 'Tasks', 'To-dos'],
          ['enablePasswords', 'Password Manager', 'Encrypted vault'],
        ];
        return h('div', { class: 'opt-grid' }, toggles.map(([key, label, desc]) => {
          const cb = h('input', { type: 'checkbox' }) as HTMLInputElement;
          cb.checked = Boolean(c[key]);
          cb.addEventListener('change', () => wiz.update({ [key]: cb.checked } as never));
          return h('label', { class: `opt${c[key] ? ' selected' : ''}` }, [cb, h('div', {}, [h('div', { class: 'opt-title' }, [label]), h('div', { class: 'opt-desc' }, [desc])])]);
        }));
      }
      case 'done':
      default:
        return h('div', {}, [h('p', {}, [`Space “${c.defaultSpace}” is ready with a ${c.theme} theme and ${c.layout} layout. Press Ctrl+K anytime to do anything.`])]);
    }
  }

  private async finishWizard(wiz: SetupWizard): Promise<void> {
    const c = wiz.config;
    this.theme = { ...this.theme, mode: c.theme, autoByTime: c.autoByTime };
    this.shell.setLayout(c.layout);
    this.activeSpace = c.defaultSpace;
    if (!this.spaces.includes(c.defaultSpace)) this.spaces.unshift(c.defaultSpace);
    this.applyTheme();
    this.renderSidebar();
    this.updateStatus();
    await this.prefs.set('onboarded', true);
    await this.prefs.set('wizardConfig', c);
    await this.savePrefs();
    this.closeModal();
    toast(this.root, 'Setup complete — welcome to 2030B');
  }

  /* ----------------------------------------------------------------- modal */

  private showModal(
    title: string,
    body: (Node | string)[],
    actions: { label: string; kind?: 'primary' | 'danger'; run: () => void }[],
  ): void {
    const row = h('div', { class: 'row' }, [
      (() => { const b = h('button', { class: 'btn' }, ['Close']); b.addEventListener('click', () => this.closeModal()); return b; })(),
      ...actions.map((a) => { const b = h('button', { class: `btn ${a.kind ?? ''}` }, [a.label]); b.addEventListener('click', a.run); return b; }),
    ]);
    this.showModalRaw([h('h2', {}, [title]), h('div', {}, body), row]);
  }
  private showModalRaw(children: Node[]): void {
    this.modalRoot.replaceChildren(h('div', { class: 'modal' }, children));
    this.modalRoot.removeAttribute('hidden');
  }
  private closeModal(): void {
    this.modalRoot.setAttribute('hidden', '');
    this.modalRoot.replaceChildren();
  }

  /* ----------------------------------------------------------- keybindings */

  private toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.renderSidebar();
    void this.savePrefs();
  }

  private bindKeys(): void {
    document.addEventListener('keydown', (e) => {
      const meta = e.ctrlKey || e.metaKey;
      // Command palette (§1) — the primary interface.
      if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); this.openPalette(); return; }
      if (meta && e.key.toLowerCase() === 't') { e.preventDefault(); this.newTab(); return; }
      if (meta && e.key.toLowerCase() === 'b') { e.preventDefault(); this.toggleSidebar(); return; }
      if (meta && e.shiftKey && e.key === '.') { e.preventDefault(); void this.toggleCopilot(); return; }

      if (!this.overlayEl.hasAttribute('hidden')) {
        const matches = this.palette.search(this.paletteInput.value);
        if (e.key === 'Escape') { e.preventDefault(); this.closePalette(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedResult = Math.min(this.selectedResult + 1, matches.length - 1); this.paintSelection(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedResult = Math.max(this.selectedResult - 1, 0); this.paintSelection(); }
        else if (e.key === 'Enter') { e.preventDefault(); this.runPaletteEnter(); }
      } else if (e.key === 'Escape' && !this.modalRoot.hasAttribute('hidden')) {
        this.closeModal();
      }
    });
  }
}

/* ----------------------------------------------------------------- bootstrap */

const root = document.getElementById('app');
if (root) {
  const app = new App(new Shell());
  void app.start(root);
}

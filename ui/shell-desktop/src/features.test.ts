/**
 * Unit tests for the next-gen UI feature models (UI/UX manifesto).
 * These are pure models, so they test the actual behaviour the renderer paints.
 */
import { describe, it, expect } from 'vitest';
import { resolveTheme, effectiveTheme, cycleMode, DEFAULT_THEME } from './theme.js';
import { defaultCards, layoutCards, reorder, toggleCard, spanClass } from './dashboard.js';
import { scoreSite, TransparencyTimeline } from './privacy.js';
import { tabsToFreeze, snapshot, FREEZE_AFTER_MS, type TabActivity } from './performance.js';
import { evaluateFriction } from './friction.js';
import { SetupWizard, DEFAULT_WIZARD_CONFIG } from './wizard.js';
import { NotesApp, TasksApp, PasswordVault } from './apps/native.js';
import { suggestChips, behavioralNudge, answer, type CopilotContext } from './copilot/engine.js';

describe('theme (§9 dark mode)', () => {
  it('resolves explicit modes directly', () => {
    expect(resolveTheme('light', { systemPrefersDark: true })).toBe('light');
    expect(resolveTheme('dark', { systemPrefersDark: false })).toBe('dark');
  });
  it('follows the system preference in system mode', () => {
    expect(resolveTheme('system', { systemPrefersDark: true })).toBe('dark');
    expect(resolveTheme('system', { systemPrefersDark: false })).toBe('light');
  });
  it('auto-switches by time of day when enabled', () => {
    expect(resolveTheme('system', { systemPrefersDark: false, hour: 22, autoByTime: true })).toBe('dark');
    expect(resolveTheme('system', { systemPrefersDark: true, hour: 12, autoByTime: true })).toBe('light');
  });
  it('honours per-site overrides', () => {
    const state = { ...DEFAULT_THEME, perSite: { 'https://example.com': 'dark' as const } };
    expect(effectiveTheme(state, 'https://example.com', { systemPrefersDark: false })).toBe('dark');
  });
  it('cycles system -> light -> dark -> system', () => {
    expect(cycleMode('system')).toBe('light');
    expect(cycleMode('light')).toBe('dark');
    expect(cycleMode('dark')).toBe('system');
  });
});

describe('bento dashboard (§8)', () => {
  it('only lays out visible cards in order', () => {
    let cards = defaultCards();
    cards = toggleCard(cards, 'c-tasks'); // hide
    const laid = layoutCards(cards);
    expect(laid.some((c) => c.id === 'c-tasks')).toBe(false);
    expect(laid.map((c) => c.order)).toEqual([...laid.map((c) => c.order)].sort((a, b) => a - b));
  });
  it('reorders a card and re-normalises order indices', () => {
    const cards = defaultCards();
    // c-recent (order 3) moves up by one, swapping with its neighbour c-quick (order 2).
    const moved = reorder(cards, 'c-recent', -1);
    const recent = moved.find((c) => c.id === 'c-recent')!;
    const quick = moved.find((c) => c.id === 'c-quick')!;
    expect(recent.order).toBeLessThan(quick.order);
    // Orders remain a dense 0..n-1 permutation.
    expect([...moved].map((c) => c.order).sort((a, b) => a - b)).toEqual(
      moved.map((_, i) => i),
    );
  });
  it('maps sizes to CSS span classes', () => {
    expect(spanClass('hero')).toContain('hero');
    expect(spanClass('wide')).toBe('col-2');
    expect(spanClass('sm')).toBe('');
  });
});

describe('privacy-as-UX (§6)', () => {
  it('scores a clean HTTPS site highly', () => {
    const s = scoreSite({ origin: 'x', trackersDetected: 5, trackersBlocked: 5, secure: true, thirdPartyCookies: 0, fingerprintingAttempts: 0 });
    expect(s.value).toBe(100);
    expect(s.grade).toBe('good');
  });
  it('penalises insecure connections and leaks', () => {
    const s = scoreSite({ origin: 'x', trackersDetected: 4, trackersBlocked: 0, secure: false, thirdPartyCookies: 2, fingerprintingAttempts: 1 });
    expect(s.value).toBeLessThan(50);
    expect(s.grade).toBe('bad');
  });
  it('records and tallies the transparency timeline newest-first', () => {
    const tl = new TransparencyTimeline();
    tl.record({ at: 1, origin: 'a', what: 'cookie', allowed: false, reason: 'default-deny' });
    tl.record({ at: 2, origin: 'b', what: 'geo', allowed: true, reason: 'user grant' });
    expect(tl.recent()[0]!.at).toBe(2);
    expect(tl.tally()).toEqual({ allowed: 1, blocked: 1 });
  });
});

describe('performance (§7 freezing + monitor)', () => {
  const now = 1_000_000_000;
  const mk = (over: Partial<TabActivity>): TabActivity => ({
    id: 'a', lastActiveAt: now, pinned: false, audible: false, memMB: 100, cpu: 0.1, frozen: false, ...over,
  });
  it('freezes only idle, unpinned, silent, non-active tabs', () => {
    const tabs = [
      mk({ id: 'idle', lastActiveAt: now - FREEZE_AFTER_MS - 1 }),
      mk({ id: 'active', lastActiveAt: now - FREEZE_AFTER_MS - 1 }),
      mk({ id: 'pinned', lastActiveAt: now - FREEZE_AFTER_MS - 1, pinned: true }),
      mk({ id: 'audible', lastActiveAt: now - FREEZE_AFTER_MS - 1, audible: true }),
      mk({ id: 'fresh', lastActiveAt: now }),
    ];
    expect(tabsToFreeze(tabs, 'active', now)).toEqual(['idle']);
  });
  it('reports reclaimable memory and heaviest tabs', () => {
    const tabs = [mk({ id: 'idle', lastActiveAt: now - FREEZE_AFTER_MS - 1, memMB: 200 }), mk({ id: 'active', memMB: 50 })];
    const s = snapshot(tabs, 'active', now);
    expect(s.reclaimableMB).toBeCloseTo(180, 0);
    expect(s.heaviest[0]!.id).toBe('idle');
  });
});

describe('meaningful friction (§5)', () => {
  it('surfaces the highest-priority prompt only', () => {
    const p = evaluateFriction({ closingUnsaved: true, openTabCount: 30 });
    expect(p?.kind).toBe('close-unsaved');
  });
  it('weights a broad-permission extension heavily with a dwell delay', () => {
    const p = evaluateFriction({ installingExtension: { name: 'X', readsAllData: true } });
    expect(p?.weight).toBeGreaterThan(0.9);
    expect(p?.dwellMs).toBeGreaterThan(0);
  });
  it('returns null when nothing is risky', () => {
    expect(evaluateFriction({ openTabCount: 3 })).toBeNull();
  });
});

describe('setup wizard (installation UI)', () => {
  it('walks steps and blocks advancing past an empty required field', () => {
    const w = new SetupWizard({ defaultSpace: '' });
    expect(w.step).toBe('welcome');
    w.next();
    expect(w.step).toBe('profile');
    expect(w.canAdvance()).toBe(false); // empty space name
    w.update({ defaultSpace: 'Home' });
    expect(w.canAdvance()).toBe(true);
    w.next();
    expect(w.step).toBe('appearance');
  });
  it('defaults to a privacy-forward, vertical-layout config', () => {
    expect(DEFAULT_WIZARD_CONFIG.blockTrackers).toBe(true);
    expect(DEFAULT_WIZARD_CONFIG.httpsOnly).toBe(true);
    expect(DEFAULT_WIZARD_CONFIG.layout).toBe('vertical');
  });
});

describe('native apps (§10)', () => {
  it('stores notes newest-first', () => {
    const n = new NotesApp();
    n.upsert({ id: '1', title: 'a', body: 'a', updatedAt: 1 });
    n.upsert({ id: '2', title: 'b', body: 'b', updatedAt: 2 });
    expect(n.list()[0]!.id).toBe('2');
    expect(n.count).toBe(2);
  });
  it('tracks open task count', () => {
    const t = new TasksApp();
    t.add({ id: '1', text: 'x', done: false, createdAt: 1 });
    t.add({ id: '2', text: 'y', done: false, createdAt: 2 });
    t.toggle('1');
    expect(t.openCount).toBe(1);
  });
  it('finds vault entries per origin', () => {
    const v = new PasswordVault();
    v.put({ id: '1', origin: 'https://a.com', username: 'u', secretRef: 'r', updatedAt: 1 });
    expect(v.forOrigin('https://a.com')).toHaveLength(1);
    expect(v.forOrigin('https://b.com')).toHaveLength(0);
  });
});

describe('AI copilot (§4)', () => {
  const ctx: CopilotContext = { url: 'about:home', title: 'Home', wordCount: 600, tabCount: 14, recentOrigins: ['a', 'b', 'c', 'd'] };
  it('suggests just-in-time chips from context', () => {
    const ids = suggestChips(ctx).map((c) => c.id);
    expect(ids).toContain('summarize'); // long page
    expect(ids).toContain('group-tabs'); // many tabs
    expect(ids).toContain('compare'); // research session
  });
  it('pushes at most one behavioral nudge', () => {
    const n = behavioralNudge(ctx);
    expect(n).not.toBeNull();
    expect(n!.role).toBe('suggest');
  });
  it('answers calculations locally and deterministically', () => {
    expect(answer('2 + 3 * 4', ctx).text).toContain('14');
  });
  it('keeps everything on-device for free-text queries', () => {
    expect(answer('summarize this page', ctx).text.toLowerCase()).toContain('gist');
  });
});

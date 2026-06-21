import { describe, it, expect } from 'vitest';
import { Shell } from './index.js';
import { TabStrip, type Tab } from './tabs/groups.js';
import { SpaceManager, MAX_SPACES_PER_PROFILE } from './spaces/index.js';
import { configFor, splitPanes, MAX_PANES } from './layouts.js';
import { PermissionStore } from './permissions.js';
import { AboutRegistry } from './about-pages.js';
import { SidePanelHost } from './side-panel.js';

function tab(id: string): Tab {
  return { id, title: id, url: `https://${id}.example`, audible: false, muted: false, pinned: false };
}

describe('TabStrip', () => {
  it('adds, orders and closes tabs', () => {
    const s = new TabStrip();
    s.addTab(tab('a'));
    s.addTab(tab('b'));
    s.addTab(tab('c'));
    expect(s.tabOrder).toEqual(['a', 'b', 'c']);
    s.closeTab('b');
    expect(s.tabOrder).toEqual(['a', 'c']);
    expect(s.tabCount).toBe(2);
  });

  it('reorders via moveTab with clamping', () => {
    const s = new TabStrip();
    ['a', 'b', 'c'].forEach((id) => s.addTab(tab(id)));
    s.moveTab('a', 99);
    expect(s.tabOrder).toEqual(['b', 'c', 'a']);
    s.moveTab('a', 0);
    expect(s.tabOrder).toEqual(['a', 'b', 'c']);
  });

  it('groups collapse and removing tabs prunes group membership', () => {
    const s = new TabStrip();
    ['a', 'b'].forEach((id) => s.addTab(tab(id)));
    s.createGroup({ id: 'g1', name: 'work', color: 'blue', collapsed: false }, ['a', 'b']);
    s.toggleCollapse('g1');
    expect(s.getGroup('g1')?.collapsed).toBe(true);
    s.closeTab('a');
    expect(s.getGroup('g1')?.tabIds).toEqual(['b']);
  });
});

describe('SpaceManager', () => {
  it('enforces the per-profile limit and isolation invariant', () => {
    const m = new SpaceManager();
    for (let i = 0; i < MAX_SPACES_PER_PROFILE; i++) {
      m.create({ id: `s${i}`, name: `s${i}`, cookieJarId: `jar${i}`, enabledExtensions: [], themeId: 'default' });
    }
    expect(m.count).toBe(MAX_SPACES_PER_PROFILE);
    expect(m.isIsolated()).toBe(true);
    expect(() =>
      m.create({ id: 'overflow', name: 'x', cookieJarId: 'jarX', enabledExtensions: [], themeId: 'default' }),
    ).toThrow(/space limit/);
  });

  it('rejects duplicate ids', () => {
    const m = new SpaceManager();
    m.create({ id: 'dup', name: 'a', cookieJarId: 'j1', enabledExtensions: [], themeId: 'default' });
    expect(() =>
      m.create({ id: 'dup', name: 'b', cookieJarId: 'j2', enabledExtensions: [], themeId: 'default' }),
    ).toThrow(/already exists/);
  });
});

describe('layouts', () => {
  it('derives preset config', () => {
    expect(configFor('minimal').autoCollapseChrome).toBe(true);
    expect(configFor('vertical').verticalTabs).toBe(true);
    expect(configFor('classic').verticalTabs).toBe(false);
  });

  it('tiles horizontal panes to fill the viewport', () => {
    const panes = splitPanes('horizontal', 2);
    expect(panes).toHaveLength(2);
    expect(panes[0]).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
    expect(panes[1]).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
  });

  it('caps panes at MAX_PANES and lays out a grid', () => {
    const panes = splitPanes('grid', 99);
    expect(panes).toHaveLength(MAX_PANES);
    const totalArea = panes.reduce((sum, p) => sum + p.w * p.h, 0);
    expect(totalArea).toBeCloseTo(1, 5);
  });
});

describe('PermissionStore (default-deny)', () => {
  it('denies by default and honors expiry', () => {
    const p = new PermissionStore();
    expect(p.query('https://x.example', 'camera')).toBe('denied');
    p.set({ origin: 'https://x.example', name: 'camera', state: 'granted', expiresAt: 1000 });
    expect(p.query('https://x.example', 'camera', 500)).toBe('granted');
    expect(p.query('https://x.example', 'camera', 2000)).toBe('denied');
  });

  it('admin lock overrides user grants', () => {
    const p = new PermissionStore();
    p.set({ origin: 'https://x.example', name: 'usb', state: 'granted' });
    p.lock('usb', 'denied');
    expect(p.query('https://x.example', 'usb')).toBe('denied');
  });
});

describe('AboutRegistry', () => {
  it('hides admin-only pages without policy', () => {
    const r = new AboutRegistry();
    expect(r.resolve('about:policies', false)).toBeNull();
    expect(r.resolve('about:policies', true)?.componentId).toBe('policies');
    expect(r.resolve('about:nonsense', true)).toBeNull();
  });
});

describe('SidePanelHost', () => {
  it('toggles the same panel closed and clamps width', () => {
    const h = new SidePanelHost();
    h.toggle({ kind: 'builtin', panel: 'copilot' });
    expect(h.isOpen).toBe(true);
    h.toggle({ kind: 'builtin', panel: 'copilot' });
    expect(h.isOpen).toBe(false);
    h.setWidth(10_000);
    expect(h.panelWidth).toBe(640);
  });
});

describe('Shell', () => {
  it('composes models and switches layout', () => {
    const shell = new Shell();
    shell.setLayout('vertical');
    expect(shell.layoutConfig.verticalTabs).toBe(true);
    expect(shell.tabs.tabCount).toBe(0);
  });
});

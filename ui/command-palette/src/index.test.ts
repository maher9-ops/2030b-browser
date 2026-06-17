import { describe, it, expect } from 'vitest';
import { fuzzyMatch, rank } from './fuzzy.js';
import { classify, safeCalc } from './omnibox.js';
import { CommandPalette } from './index.js';

describe('fuzzyMatch', () => {
  it('matches a subsequence', () => {
    const m = fuzzyMatch('nt', 'New Tab');
    expect(m).not.toBeNull();
  });

  it('rejects a non-subsequence', () => {
    expect(fuzzyMatch('xyz', 'New Tab')).toBeNull();
  });

  it('scores consecutive and word-boundary matches higher', () => {
    const consec = fuzzyMatch('new', 'New Tab')!;
    const scattered = fuzzyMatch('nwt', 'New Tab')!;
    expect(consec.score).toBeGreaterThan(scattered.score);
  });
});

describe('rank', () => {
  it('orders better matches first', () => {
    const items = [{ label: 'Open Downloads' }, { label: 'New Tab' }, { label: 'New Window' }];
    const result = rank('new', items);
    expect(result[0]!.label.startsWith('New')).toBe(true);
    expect(result.find((i) => i.label === 'Open Downloads')).toBeUndefined();
  });
});

describe('omnibox classify', () => {
  it('detects a bare domain as navigation', () => {
    const r = classify('example.com');
    expect(r.kind).toBe('navigate');
    if (r.kind === 'navigate') expect(r.url).toBe('https://example.com');
  });

  it('treats free text as search', () => {
    expect(classify('best rust crates').kind).toBe('search');
  });

  it('evaluates a calculation', () => {
    const r = classify('2 + 3 * 4');
    expect(r.kind).toBe('calculator');
    if (r.kind === 'calculator') expect(r.result).toBe(14);
  });

  it('routes ?-prefixed input to AI', () => {
    const r = classify('? summarize this page');
    expect(r.kind).toBe('ai');
    if (r.kind === 'ai') expect(r.prompt).toBe('summarize this page');
  });
});

describe('safeCalc', () => {
  it('rejects identifiers and calls', () => {
    expect(safeCalc('alert(1)')).toBeNull();
    expect(safeCalc('1')).toBeNull(); // no operator
  });
  it('computes parentheses', () => {
    expect(safeCalc('(1 + 2) * 3')).toBe(9);
  });
});

describe('CommandPalette', () => {
  it('registers and searches commands', () => {
    const p = new CommandPalette();
    p.register({ id: 'new-tab', label: 'New Tab', shortcut: 'Ctrl+T' });
    p.register({ id: 'close-tab', label: 'Close Tab', shortcut: 'Ctrl+W' });
    expect(p.size).toBe(2);
    const results = p.search('new');
    expect(results[0]!.id).toBe('new-tab');
  });
});

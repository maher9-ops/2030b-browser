import { describe, it, expect } from 'vitest';
import { negotiate, evaluateQuality, BUDGET } from './index.js';

describe('negotiate (default-deny)', () => {
  it('denies without a grant', () => {
    const s = negotiate({ region: 'eu-west', maxBitrateKbps: 8000 });
    expect(s.kind).toBe('denied');
  });

  it('denies without a region', () => {
    const s = negotiate({ region: '', grantId: 'g1', maxBitrateKbps: 8000 });
    expect(s.kind).toBe('denied');
  });

  it('activates and clamps bitrate to the budget ceiling', () => {
    const s = negotiate({ region: 'eu-west', grantId: 'g1', maxBitrateKbps: 999_999 });
    expect(s.kind).toBe('active');
    if (s.kind === 'active') {
      expect(s.bitrateKbps).toBe(BUDGET.maxBitrateKbps);
      expect(s.sessionId).toMatch(/^sess-/);
    }
  });
});

describe('evaluateQuality', () => {
  it('reconnects below min fps', () => {
    expect(evaluateQuality({ fps: 10, inputLatencyMs: 20 })).toBe('reconnect');
  });
  it('degrades on high latency', () => {
    expect(evaluateQuality({ fps: 60, inputLatencyMs: 200 })).toBe('degrade');
  });
  it('holds when within budget', () => {
    expect(evaluateQuality({ fps: 60, inputLatencyMs: 20 })).toBe('hold');
  });
});

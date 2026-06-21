import { describe, it, expect } from 'vitest';
import { PipController } from './index.js';

describe('PipController', () => {
  it('starts inactive', () => {
    const c = new PipController();
    expect(c.current.active).toBe(false);
    expect(c.current.playing).toBe(false);
  });

  it('enters PiP preserving aspect ratio and clamping width', () => {
    const c = new PipController();
    c.enter(1920, 1080);
    expect(c.current.active).toBe(true);
    expect(c.current.playing).toBe(true);
    expect(c.current.width).toBe(640);
    expect(c.current.height).toBe(360);
  });

  it('toggles play only while active', () => {
    const c = new PipController();
    c.togglePlay();
    expect(c.current.playing).toBe(false);
    c.enter(640, 360);
    c.togglePlay();
    expect(c.current.playing).toBe(false);
  });

  it('clamps move within the viewport', () => {
    const c = new PipController();
    c.enter(640, 360);
    c.move(2, -1);
    expect(c.current.x).toBe(1);
    expect(c.current.y).toBe(0);
  });

  it('exit resets to defaults', () => {
    const c = new PipController();
    c.enter(640, 360);
    c.exit();
    expect(c.current.active).toBe(false);
  });
});

/**
 * Picture-in-Picture controller (Chrome/Firefox parity §PiP). Tracks the
 * floating video window's geometry and playback state. DOM-free model.
 */

export interface PipState {
  active: boolean;
  /** Bottom-right anchored by default; normalized [0,1] position of top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  playing: boolean;
}

const DEFAULT: PipState = { active: false, x: 0.7, y: 0.7, width: 320, height: 180, playing: false };

export class PipController {
  private state: PipState = { ...DEFAULT };

  enter(width: number, height: number): void {
    const aspect = height > 0 ? width / height : 16 / 9;
    const w = Math.max(160, Math.min(width, 640));
    this.state = { ...DEFAULT, active: true, playing: true, width: w, height: Math.round(w / aspect) };
  }

  exit(): void {
    this.state = { ...DEFAULT };
  }

  togglePlay(): void {
    if (this.state.active) this.state.playing = !this.state.playing;
  }

  move(x: number, y: number): void {
    if (!this.state.active) return;
    this.state.x = Math.max(0, Math.min(x, 1));
    this.state.y = Math.max(0, Math.min(y, 1));
  }

  get current(): Readonly<PipState> {
    return this.state;
  }
}

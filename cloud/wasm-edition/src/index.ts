/**
 * @b2030b/wasm-edition — the streaming/cloud "thin client" edition
 * (2030 Forward Features, deployment spec §cloud). Renders remotely and streams
 * frames to a WebAssembly client; only encrypted input events flow upstream.
 *
 * This module is the *session orchestration* model: it negotiates a session,
 * tracks frame/latency budgets, and enforces default-deny (no session without
 * an explicit, user-approved capability grant). The actual WASM codec lives in
 * the engine; here we keep pure, testable session logic.
 */

export interface SessionRequest {
  /** Region the user explicitly selected (no auto-routing). */
  region: string;
  /** User-approved capability grant id; absent => denied. */
  grantId?: string;
  maxBitrateKbps: number;
}

export type SessionState =
  | { kind: 'denied'; reason: string }
  | { kind: 'active'; sessionId: string; bitrateKbps: number };

/** Performance budget for the streaming client (deployment spec §7). */
export const BUDGET = {
  /** Hard cap on end-to-end input latency before we degrade quality. */
  maxInputLatencyMs: 80,
  /** Minimum acceptable frame rate before reconnect. */
  minFps: 24,
  /** Absolute bitrate ceiling regardless of request. */
  maxBitrateKbps: 12_000,
} as const;

let counter = 0;
function newSessionId(): string {
  counter += 1;
  return `sess-${counter.toString(36)}-${Date.now().toString(36)}`;
}

/** Negotiate a session. Default-deny: no grant => no session. */
export function negotiate(req: SessionRequest): SessionState {
  if (!req.grantId) {
    return { kind: 'denied', reason: 'no user capability grant (default-deny)' };
  }
  if (!req.region) {
    return { kind: 'denied', reason: 'no region selected' };
  }
  const bitrateKbps = Math.max(500, Math.min(req.maxBitrateKbps, BUDGET.maxBitrateKbps));
  return { kind: 'active', sessionId: newSessionId(), bitrateKbps };
}

export interface FrameStats {
  fps: number;
  inputLatencyMs: number;
}

export type QualityAction = 'hold' | 'degrade' | 'reconnect';

/** Decide how to react to live frame stats against the budget. */
export function evaluateQuality(stats: FrameStats): QualityAction {
  if (stats.fps < BUDGET.minFps) return 'reconnect';
  if (stats.inputLatencyMs > BUDGET.maxInputLatencyMs) return 'degrade';
  return 'hold';
}

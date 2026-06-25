/**
 * Copilot Web Worker (UI/UX manifesto §4 technical requirement: "Use Web
 * Workers for heavy AI processing — don't block the UI thread").
 *
 * The worker owns the deterministic copilot engine and answers request/response
 * messages. Today the engine is local + synchronous; moving it off-thread keeps
 * the contract ready for a real WASM model that may block for hundreds of ms.
 */

import { answer, suggestChips, behavioralNudge, type CopilotContext } from './engine.js';

export type WorkerRequest =
  | { id: number; kind: 'ask'; query: string; ctx: CopilotContext }
  | { id: number; kind: 'chips'; ctx: CopilotContext }
  | { id: number; kind: 'nudge'; ctx: CopilotContext };

export type WorkerResponse =
  | { id: number; kind: 'ask'; item: ReturnType<typeof answer> }
  | { id: number; kind: 'chips'; chips: ReturnType<typeof suggestChips> }
  | { id: number; kind: 'nudge'; item: ReturnType<typeof behavioralNudge> };

// `self` is the DedicatedWorkerGlobalScope at runtime. Guard so this module can
// also be imported in a non-worker (test) context without throwing.
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (msg: WorkerResponse) => void;
};

if (typeof ctx.postMessage === 'function') {
  ctx.onmessage = (e: MessageEvent<WorkerRequest>): void => {
    const req = e.data;
    switch (req.kind) {
      case 'ask':
        ctx.postMessage({ id: req.id, kind: 'ask', item: answer(req.query, req.ctx) });
        break;
      case 'chips':
        ctx.postMessage({ id: req.id, kind: 'chips', chips: suggestChips(req.ctx) });
        break;
      case 'nudge':
        ctx.postMessage({ id: req.id, kind: 'nudge', item: behavioralNudge(req.ctx) });
        break;
    }
  };
}

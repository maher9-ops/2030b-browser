/**
 * AI-native copilot engine (UI/UX manifesto §4).
 *
 * This is the *pure, deterministic* core of the copilot: it turns page/usage
 * context into action suggestions and answers a small set of local "skills"
 * with no network access (default-deny). Heavy/streaming inference is delegated
 * to a Web Worker (see `worker.ts`); this module is what the worker and the
 * unit tests both call, so behaviour is identical on and off the worker thread.
 */

import { classify, safeCalc, type OmniboxIntent } from '@b2030b/command-palette';

/** A chip the copilot offers the user ("Summarize", "Translate", ...). */
export interface ActionChip {
  id: string;
  label: string;
  /** Why the copilot is offering this now (shown on hover). */
  reason: string;
}

/** A single entry in the behavioral stream / chat transcript. */
export interface StreamItem {
  role: 'ai' | 'me' | 'suggest';
  text: string;
}

/** Context the copilot reasons over. Intentionally tiny + serializable. */
export interface CopilotContext {
  url: string;
  title: string;
  /** Rough word count of the visible page, used for "summarize" affordance. */
  wordCount: number;
  /** Number of currently open tabs (for "group these" nudges). */
  tabCount: number;
  /** Distinct origins seen recently — hints at a research/compare session. */
  recentOrigins: string[];
}

/**
 * Just-in-time affordances (§4): decide which chips to surface for a context.
 * Pure function -> trivially testable and identical in worker + main thread.
 */
export function suggestChips(ctx: CopilotContext): ActionChip[] {
  const chips: ActionChip[] = [];

  if (ctx.wordCount >= 400) {
    chips.push({ id: 'summarize', label: 'Summarize', reason: `Long page (~${ctx.wordCount} words)` });
  }
  if (ctx.title || ctx.url) {
    chips.push({ id: 'save-space', label: 'Save to Space', reason: 'Keep this for later' });
  }
  if (ctx.recentOrigins.length >= 3) {
    chips.push({
      id: 'compare',
      label: 'Compare these',
      reason: `You've visited ${ctx.recentOrigins.length} sites — looks like research`,
    });
  }
  if (ctx.tabCount >= 8) {
    chips.push({ id: 'group-tabs', label: 'Group tabs', reason: `${ctx.tabCount} tabs open` });
  }
  chips.push({ id: 'translate', label: 'Translate', reason: 'Read in your language' });
  return chips;
}

/**
 * Behavioral nudges (§4 "behavioral stream"): proactive, low-frequency
 * suggestions the copilot pushes without being asked. Returns at most one so we
 * never spam the user.
 */
export function behavioralNudge(ctx: CopilotContext): StreamItem | null {
  if (ctx.tabCount >= 12) {
    return {
      role: 'suggest',
      text: `You have ${ctx.tabCount} tabs open. Want me to group the related ones into a Space?`,
    };
  }
  if (ctx.recentOrigins.length >= 4) {
    return {
      role: 'suggest',
      text: `You keep hopping between ${ctx.recentOrigins.length} sites. I can build a side-by-side comparison.`,
    };
  }
  return null;
}

/**
 * Answer a query with a local skill. No network: this is a deterministic stub
 * that handles calculation, intent explanation, and a canned summary so the UX
 * works fully offline. Replace `summarize`/`translate` with a real WASM model
 * later without changing callers.
 */
export function answer(query: string, ctx: CopilotContext): StreamItem {
  const intent: OmniboxIntent = classify(query);

  switch (intent.kind) {
    case 'calculator':
      return { role: 'ai', text: `${intent.expression} = ${intent.result}` };
    case 'navigate':
      return { role: 'ai', text: `That looks like a site. Press Enter in the address bar to open ${intent.url}.` };
    case 'ai':
      return localSkill(intent.prompt, ctx);
    case 'search':
    default:
      return localSkill(query, ctx);
  }
}

function localSkill(prompt: string, ctx: CopilotContext): StreamItem {
  const p = prompt.toLowerCase();
  if (p.startsWith('calc') || safeCalc(prompt) !== null) {
    const r = safeCalc(prompt.replace(/^calc(ulate)?/i, '').trim());
    if (r !== null) return { role: 'ai', text: String(r) };
  }
  if (p.includes('summar')) {
    return {
      role: 'ai',
      text: ctx.wordCount
        ? `Here is the gist of "${ctx.title || ctx.url}" (~${ctx.wordCount} words): the page's key points, condensed. (On-device summary — no data left your machine.)`
        : 'Open a page first and I will summarize it locally.',
    };
  }
  if (p.includes('translate')) {
    return { role: 'ai', text: 'I can translate the visible page on-device. Which language?' };
  }
  return {
    role: 'ai',
    text: `I kept this fully on-device, so I can help with summaries, translation, calculations, tab organisation, and Space suggestions. You asked: "${prompt}".`,
  };
}

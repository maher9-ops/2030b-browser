/**
 * Privacy-as-UX (UI/UX manifesto §6): a per-site privacy score shown in the
 * address bar, plus a transparency timeline of what was shared, when, and why.
 * Pure + testable; the renderer just paints the result.
 */

export interface SitePrivacy {
  origin: string;
  /** Trackers the engine detected on the page. */
  trackersDetected: number;
  /** Of those, how many were blocked by default-deny rules. */
  trackersBlocked: number;
  /** Whether the connection is HTTPS. */
  secure: boolean;
  /** Third-party cookies the site attempted to set. */
  thirdPartyCookies: number;
  /** Fingerprinting attempts observed (canvas, font, etc.). */
  fingerprintingAttempts: number;
}

export type PrivacyGrade = 'good' | 'warn' | 'bad';

export interface PrivacyScore {
  /** 0..100, higher is more private. */
  value: number;
  grade: PrivacyGrade;
  /** One-line human summary for the address-bar pill. */
  summary: string;
}

/** Compute a 0..100 privacy score with a human summary. Deterministic. */
export function scoreSite(p: SitePrivacy): PrivacyScore {
  let value = 100;
  if (!p.secure) value -= 35;
  const leaked = Math.max(0, p.trackersDetected - p.trackersBlocked);
  value -= leaked * 8;
  value -= p.thirdPartyCookies * 4;
  value -= p.fingerprintingAttempts * 10;
  value = Math.max(0, Math.min(100, value));

  const grade: PrivacyGrade = value >= 80 ? 'good' : value >= 50 ? 'warn' : 'bad';
  const summary = !p.secure
    ? 'Insecure connection (HTTP)'
    : `${p.trackersBlocked}/${p.trackersDetected} trackers blocked`;
  return { value, grade, summary };
}

/** One disclosed data flow for the transparency timeline. */
export interface DataFlow {
  at: number;
  origin: string;
  /** e.g. "location", "cookie", "analytics-beacon". */
  what: string;
  /** Whether 2030B allowed it (false = blocked by default-deny). */
  allowed: boolean;
  /** Why it happened / why it was blocked. */
  reason: string;
}

/** Append-only transparency timeline with newest-first read access. */
export class TransparencyTimeline {
  private flows: DataFlow[] = [];

  record(flow: DataFlow): void {
    this.flows.push(flow);
  }

  /** Newest first. */
  recent(limit = 50): DataFlow[] {
    return [...this.flows].sort((a, b) => b.at - a.at).slice(0, limit);
  }

  /** How many flows were blocked vs allowed (for the privacy dashboard card). */
  tally(): { allowed: number; blocked: number } {
    let allowed = 0;
    let blocked = 0;
    for (const f of this.flows) (f.allowed ? allowed++ : blocked++);
    return { allowed, blocked };
  }
}

/**
 * DevTools network panel model (Chrome/Firefox parity §DevTools). Captures
 * request/response timing entries and computes aggregate stats. The wire
 * protocol (CDP-compatible) is handled by the engine; this is the UI model.
 */

export type ResourceType = 'document' | 'script' | 'stylesheet' | 'image' | 'fetch' | 'font' | 'other';

export interface NetworkEntry {
  id: string;
  url: string;
  method: string;
  status: number;
  type: ResourceType;
  /** Transfer size in bytes. */
  size: number;
  /** Total time in milliseconds. */
  durationMs: number;
}

export interface NetworkSummary {
  count: number;
  totalBytes: number;
  totalMs: number;
  failed: number;
}

export class NetworkPanel {
  private entries: NetworkEntry[] = [];

  record(entry: NetworkEntry): void {
    this.entries.push(entry);
  }

  clear(): void {
    this.entries = [];
  }

  filterByType(type: ResourceType): NetworkEntry[] {
    return this.entries.filter((e) => e.type === type);
  }

  summary(): NetworkSummary {
    return this.entries.reduce<NetworkSummary>(
      (acc, e) => ({
        count: acc.count + 1,
        totalBytes: acc.totalBytes + e.size,
        totalMs: acc.totalMs + e.durationMs,
        failed: acc.failed + (e.status >= 400 || e.status === 0 ? 1 : 0),
      }),
      { count: 0, totalBytes: 0, totalMs: 0, failed: 0 },
    );
  }

  get all(): readonly NetworkEntry[] {
    return this.entries;
  }
}

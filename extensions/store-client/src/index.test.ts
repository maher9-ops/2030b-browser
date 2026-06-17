import { describe, it, expect } from 'vitest';
import {
  reviewCapabilities,
  verifyIntegrity,
  StoreClient,
  type StoreListing,
  type StoreTransport,
  type DownloadedPackage,
} from './index.js';

function listing(over: Partial<StoreListing> = {}): StoreListing {
  return {
    id: 'ext1',
    name: 'Example',
    version: '1.0.0',
    expectedDigest: 'abc123',
    permissions: ['storage'],
    hostOrigins: [],
    reviewed: true,
    ...over,
  };
}

describe('reviewCapabilities', () => {
  it('separates sensitive permissions and requires consent', () => {
    const r = reviewCapabilities(listing({ permissions: ['storage', 'cookies', 'history'] }));
    expect(r.sensitive.sort()).toEqual(['cookies', 'history']);
    expect(r.ordinary).toEqual(['storage']);
    expect(r.requiresExplicitConsent).toBe(true);
  });

  it('requires consent for <all_urls> even without sensitive perms', () => {
    const r = reviewCapabilities(listing({ permissions: ['storage'], hostOrigins: ['<all_urls>'] }));
    expect(r.requiresExplicitConsent).toBe(true);
  });

  it('no consent needed for an innocuous extension', () => {
    expect(reviewCapabilities(listing()).requiresExplicitConsent).toBe(false);
  });
});

describe('verifyIntegrity', () => {
  const pkg = (over: Partial<DownloadedPackage> = {}): DownloadedPackage => ({
    id: 'ext1',
    bytes: new Uint8Array([1, 2, 3]),
    digest: 'abc123',
    ...over,
  });

  it('passes on matching digest of a reviewed listing', () => {
    expect(verifyIntegrity(listing(), pkg())).toEqual({ ok: true });
  });

  it('fails on digest mismatch', () => {
    expect(verifyIntegrity(listing(), pkg({ digest: 'deadbeef' }))).toEqual({
      ok: false,
      reason: 'digest-mismatch',
    });
  });

  it('fails on unreviewed listing', () => {
    expect(verifyIntegrity(listing({ reviewed: false }), pkg())).toEqual({
      ok: false,
      reason: 'unreviewed',
    });
  });
});

describe('StoreClient', () => {
  it('runs the full install review pipeline via injected transport', async () => {
    const l = listing({ permissions: ['cookies'] });
    const transport: StoreTransport = {
      fetchListing: async () => l,
      download: async () => ({ id: 'ext1', bytes: new Uint8Array(), digest: 'abc123' }),
    };
    const client = new StoreClient(transport);
    const res = await client.install('ext1');
    expect(res.review.requiresExplicitConsent).toBe(true);
    expect(res.integrity).toEqual({ ok: true });
  });
});

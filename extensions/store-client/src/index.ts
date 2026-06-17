/**
 * @b2030b/store-client — the extension-store client model (Extension Ecosystem
 * spec §6). Browses listings, verifies package integrity, and surfaces the
 * exact MV4 capabilities an extension requests *before* install (informed
 * consent). Network access is injected so the model stays pure/testable and so
 * the default-deny network policy is enforced by the caller, not hidden here.
 */

export interface StoreListing {
  id: string;
  name: string;
  version: string;
  /** Sigstore bundle digest (hex) the downloaded package must match. */
  expectedDigest: string;
  /** MV4 permission ids the extension requests. */
  permissions: string[];
  /** Origin capability patterns the extension requests. */
  hostOrigins: string[];
  /** Whether the listing has been reviewed and signed by the store. */
  reviewed: boolean;
}

export interface DownloadedPackage {
  id: string;
  bytes: Uint8Array;
  /** Digest computed by the integrity verifier (hex). */
  digest: string;
}

/** Result of a pre-install capability review shown to the user. */
export interface CapabilityReview {
  id: string;
  /** Permissions grouped as sensitive vs. ordinary for UX emphasis. */
  sensitive: string[];
  ordinary: string[];
  hostOrigins: string[];
  /** True only when every sensitive request is acknowledged. */
  requiresExplicitConsent: boolean;
}

/** Permissions that demand an extra confirmation step. */
const SENSITIVE = new Set([
  'webRequest',
  'webRequestBlocking',
  'declarativeNetRequest',
  'cookies',
  'history',
  'downloads',
  'nativeMessaging',
  'debugger',
]);

/** Build the capability review a user must approve before install. */
export function reviewCapabilities(listing: StoreListing): CapabilityReview {
  const sensitive: string[] = [];
  const ordinary: string[] = [];
  for (const p of listing.permissions) {
    (SENSITIVE.has(p) ? sensitive : ordinary).push(p);
  }
  return {
    id: listing.id,
    sensitive,
    ordinary,
    hostOrigins: listing.hostOrigins,
    requiresExplicitConsent: sensitive.length > 0 || listing.hostOrigins.includes('<all_urls>'),
  };
}

export type IntegrityResult =
  | { ok: true }
  | { ok: false; reason: 'digest-mismatch' | 'unreviewed' };

/** Verify a downloaded package against its store listing (default-deny). */
export function verifyIntegrity(listing: StoreListing, pkg: DownloadedPackage): IntegrityResult {
  if (!listing.reviewed) return { ok: false, reason: 'unreviewed' };
  if (pkg.id !== listing.id || pkg.digest !== listing.expectedDigest) {
    return { ok: false, reason: 'digest-mismatch' };
  }
  return { ok: true };
}

/** Abstract transport so callers control (and can deny) network access. */
export interface StoreTransport {
  fetchListing(id: string): Promise<StoreListing>;
  download(id: string): Promise<DownloadedPackage>;
}

export class StoreClient {
  constructor(private readonly transport: StoreTransport) {}

  async install(
    id: string,
  ): Promise<{ listing: StoreListing; review: CapabilityReview; integrity: IntegrityResult }> {
    const listing = await this.transport.fetchListing(id);
    const review = reviewCapabilities(listing);
    const pkg = await this.transport.download(id);
    const integrity = verifyIntegrity(listing, pkg);
    return { listing, review, integrity };
  }
}

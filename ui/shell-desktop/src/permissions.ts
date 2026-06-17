/**
 * Per-site permission model (Security/Privacy spec §3; default-deny).
 *
 * Every capability a site can request starts DENIED. The user (or admin policy)
 * must explicitly grant it; grants are origin-scoped and may expire.
 */

export type PermissionName =
  | 'geolocation'
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'clipboard-read'
  | 'midi'
  | 'usb'
  | 'serial'
  | 'hid'
  | 'idle-detection'
  | 'storage-access';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export interface PermissionGrant {
  origin: string;
  name: PermissionName;
  state: PermissionState;
  /** Epoch millis after which the grant lapses; undefined = session/forever. */
  expiresAt?: number;
}

/** Decision precedence: admin lock wins, then user grant, then default-deny. */
export class PermissionStore {
  private grants = new Map<string, PermissionGrant>();
  private adminLocked = new Map<string, PermissionState>();

  private key(origin: string, name: PermissionName): string {
    return `${origin}\u0000${name}`;
  }

  /** Admin policy can pin a permission to a fixed state (cannot be overridden). */
  lock(name: PermissionName, state: PermissionState): void {
    this.adminLocked.set(name, state);
  }

  set(grant: PermissionGrant): void {
    this.grants.set(this.key(grant.origin, grant.name), grant);
  }

  query(origin: string, name: PermissionName, now: number = Date.now()): PermissionState {
    const locked = this.adminLocked.get(name);
    if (locked) return locked;
    const g = this.grants.get(this.key(origin, name));
    if (!g) return 'denied';
    if (g.expiresAt !== undefined && now >= g.expiresAt) return 'denied';
    return g.state;
  }

  revoke(origin: string, name: PermissionName): void {
    this.grants.delete(this.key(origin, name));
  }
}

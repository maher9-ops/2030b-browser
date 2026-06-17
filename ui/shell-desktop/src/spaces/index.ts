/**
 * Spaces / Workspaces (UI/UX spec §5): up to 64 per profile, each with an
 * isolated cookie jar, extension set, theme, and admin policy scope.
 */

export const MAX_SPACES_PER_PROFILE = 64;

export interface Space {
  id: string;
  name: string;
  /** Identifier of the isolated cookie jar / storage partition. */
  cookieJarId: string;
  /** Extension ids enabled in this space. */
  enabledExtensions: string[];
  /** Theme id applied to this space. */
  themeId: string;
}

export class SpaceManager {
  private spaces: Space[] = [];

  /** Create a space. Throws if the per-profile limit is exceeded. */
  create(space: Space): void {
    if (this.spaces.length >= MAX_SPACES_PER_PROFILE) {
      throw new Error(`space limit reached (${MAX_SPACES_PER_PROFILE} per profile)`);
    }
    if (this.spaces.some((s) => s.id === space.id)) {
      throw new Error(`space id already exists: ${space.id}`);
    }
    this.spaces.push(space);
  }

  remove(id: string): void {
    this.spaces = this.spaces.filter((s) => s.id !== id);
  }

  /** Two spaces must never share a cookie jar (isolation invariant). */
  isIsolated(): boolean {
    const jars = new Set(this.spaces.map((s) => s.cookieJarId));
    return jars.size === this.spaces.length;
  }

  get count(): number {
    return this.spaces.length;
  }

  list(): readonly Space[] {
    return this.spaces;
  }
}

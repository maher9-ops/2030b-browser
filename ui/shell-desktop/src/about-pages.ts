/**
 * Internal about: page registry (Firefox parity §about, Chrome chrome:// parity).
 * Maps internal URLs to their handler component ids. Default-deny: unknown
 * about: targets resolve to the error page rather than a blank document.
 */

export interface AboutPage {
  /** e.g. "about:settings", "about:policies", "about:privacy". */
  url: string;
  title: string;
  componentId: string;
  /** Whether the page is only reachable when an admin policy is present. */
  adminOnly: boolean;
}

const PAGES: readonly AboutPage[] = [
  { url: 'about:home', title: 'Home', componentId: 'home', adminOnly: false },
  { url: 'about:settings', title: 'Settings', componentId: 'settings', adminOnly: false },
  { url: 'about:privacy', title: 'Privacy & Security', componentId: 'privacy', adminOnly: false },
  { url: 'about:downloads', title: 'Downloads', componentId: 'downloads', adminOnly: false },
  { url: 'about:extensions', title: 'Extensions', componentId: 'extensions', adminOnly: false },
  { url: 'about:history', title: 'History', componentId: 'history', adminOnly: false },
  { url: 'about:permissions', title: 'Site Permissions', componentId: 'permissions', adminOnly: false },
  { url: 'about:spaces', title: 'Spaces', componentId: 'spaces', adminOnly: false },
  { url: 'about:policies', title: 'Active Policies', componentId: 'policies', adminOnly: true },
  { url: 'about:about', title: 'About Browser 2030B', componentId: 'about', adminOnly: false },
];

export class AboutRegistry {
  private byUrl = new Map<string, AboutPage>(PAGES.map((p) => [p.url, p]));

  resolve(url: string, hasAdminPolicy: boolean): AboutPage | null {
    const page = this.byUrl.get(url);
    if (!page) return null;
    if (page.adminOnly && !hasAdminPolicy) return null;
    return page;
  }

  list(hasAdminPolicy: boolean): AboutPage[] {
    return PAGES.filter((p) => !p.adminOnly || hasAdminPolicy);
  }
}

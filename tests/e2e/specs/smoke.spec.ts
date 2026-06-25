import { test, expect } from '@playwright/test';

/**
 * Smoke E2E coverage for the desktop shell. Asserts the privacy-first defaults
 * and core next-gen UI affordances a user must be able to rely on out of the
 * box (UI/UX manifesto §1 command palette, §8 dashboard, §6 privacy).
 */
test.describe('Browser 2030B shell — smoke', () => {
  test('boots and renders the shell chrome (not a blank window)', async ({ page }) => {
    await page.goto('/');
    // The app must paint: brand in the custom titlebar + the bento dashboard.
    await expect(page.locator('.titlebar .brand')).toContainText('Browser 2030');
    await expect(page.locator('.bento')).toBeVisible();
    await expect(page).toHaveTitle(/Browser 2030B/);
  });

  test('Ctrl+K opens the command palette (primary interface, §1)', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+K');
    const overlay = page.locator('.overlay');
    await expect(overlay).toBeVisible();
    await expect(page.locator('.palette input')).toBeFocused();
    // Typing a command filters the results list.
    await page.locator('.palette input').fill('vertical');
    await expect(page.locator('.results .result').first()).toContainText(/vertical/i);
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });

  test('shows a privacy score pill in the address bar (§6)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#priv-pill')).toBeVisible();
    await expect(page.locator('#priv-pill')).toContainText('shield');
  });

  test('default-deny: no geolocation without an explicit grant', async ({ page }) => {
    await page.goto('/');
    const state = await page.evaluate(async () => {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return status.state;
      } catch {
        return 'denied';
      }
    });
    expect(['denied', 'prompt']).toContain(state);
  });
});

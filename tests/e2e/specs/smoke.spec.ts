import { test, expect } from '@playwright/test';

/**
 * Smoke E2E coverage for the desktop shell. Asserts the privacy-first defaults
 * a user must be able to rely on out of the box.
 */
test.describe('Browser 2030B shell — smoke', () => {
  test('boots and shows the status line', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#status')).toContainText('Browser 2030B');
  });

  test('Ctrl+K runs the top command (new tab)', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+K');
    await expect(page.locator('#status')).toContainText('tabs');
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

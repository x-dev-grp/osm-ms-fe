import { test, expect } from '@playwright/test';
import { login, requireLogin, expectAuthenticatedShell } from './helpers/auth';
import { mockIssueTemporaryPassword } from './helpers/password-reset';

test.describe('Admin password reset', () => {
  test.beforeEach(async ({ page }) => {
    requireLogin(test);
    await login(page);
    await expectAuthenticatedShell(page);
  });

  test('admin can issue temporary password for a user', async ({ page }) => {
    const issueMock = await mockIssueTemporaryPassword(page);

    await page.goto('/administration/users');
    await expect(page.locator('app-admin-users, oosm-dashboard').first()).toBeVisible({ timeout: 20000 });

    const rowCount = await page
      .locator('oosm-dashboard table tbody tr, oosm-dashboard .oosm-dashboard-card')
      .count();
    test.skip(rowCount === 0, 'No users in admin users list — seed a user or skip');

    await page.locator('oosm-dashboard mat-icon', { hasText: 'more_vert' }).first().click();

    const resetMenuItem = page
      .locator('button[mat-menu-item], [role="menuitem"]')
      .filter({ has: page.locator('mat-icon', { hasText: 'lock_reset' }) })
      .or(
        page.locator('button[mat-menu-item], [role="menuitem"]').filter({
          hasText: /réinitialiser|reset password|إعادة تعيين/i
        })
      )
      .first();

    await expect(resetMenuItem).toBeVisible({ timeout: 10000 });
    await resetMenuItem.click();

    const dialog = page.locator('app-confirmation-dialog, .confirmation-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.locator('button[aria-label="Confirm"]').click();

    await issueMock.waitForCall();
    await expect(page.locator('.mat-mdc-snack-bar-container, .app-toast, snack-bar-container').first()).toBeVisible({
      timeout: 15000
    });
  });
});

import { test, expect } from '@playwright/test';
import { login, requireLogin, expectAuthenticatedShell } from './helpers/auth';

test.describe('Cross-module journey', () => {
  test.beforeEach(async ({ page }) => {
    requireLogin(test);
    await login(page);
    await expectAuthenticatedShell(page);
  });

  test('help module links navigate to feature areas', async ({ page }) => {
    const routes = ['/reception', '/storage', '/finance', '/stock', '/of'];

    for (const route of routes) {
      await page.goto('/help');
      const link = page.locator(`a[href="${route}"], a[ng-reflect-router-link="${route}"]`).first();
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL(new RegExp(route.replace('/', '\\/')), { timeout: 15000 });
    }
  });

  test('reception → supplier → finance path via direct URLs', async ({ page }) => {
    await page.goto('/reception/reception-olive/simple_reception');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });

    await page.goto('/reception/fournisseur');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });

    await page.goto('/finance/transactions');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });

    await page.goto('/storage/oil-transactions');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('storage recap and finance dashboard render', async ({ page }) => {
    await page.goto('/storage/storage_recap');
    await expect(page.locator('app-storage-units-board, .storage-recap, mat-card').first()).toBeVisible({
      timeout: 15000
    });

    await page.goto('/finance');
    await expect(page.locator('app-finance-dashboard, .finance-dashboard, mat-card').first()).toBeVisible({
      timeout: 15000
    });
  });
});

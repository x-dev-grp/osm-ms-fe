import { test, expect } from '@playwright/test';
import { login, requireLogin, expectAuthenticatedShell } from './helpers/auth';

test.describe('Reception module flows', () => {
  test.beforeEach(async ({ page }) => {
    requireLogin(test);
    await login(page);
    await expectAuthenticatedShell(page);
  });

  test('reception dashboard loads', async ({ page }) => {
    await page.goto('/reception');
    await expect(page).toHaveURL(/\/reception/);
    await expect(page.locator('app-reception-dashboard, oosm-dashboard, .reception-dashboard').first()).toBeVisible({
      timeout: 15000
    });
  });

  test('olive simple reception list (OosmDashboard)', async ({ page }) => {
    await page.goto('/reception/reception-olive/simple_reception');
    await expect(page).toHaveURL(/simple_reception/);
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('oil reception list loads', async ({ page }) => {
    await page.goto('/reception/reception-huile');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('supplier list loads', async ({ page }) => {
    await page.goto('/reception/fournisseur');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('unified reception history list loads', async ({ page }) => {
    await page.goto('/reception/reception-list');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('olive QC list loads', async ({ page }) => {
    await page.goto('/reception/olive_qc');
    await expect(page.locator('oosm-dashboard, app-olive-qc').first()).toBeVisible({ timeout: 15000 });
  });

  test('mill machines list loads', async ({ page }) => {
    await page.goto('/reception/mill-machines');
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
  });
});

import { test, expect } from '@playwright/test';
import { login, requireLogin, expectAuthenticatedShell } from './helpers/auth';

const moduleRoutes = [
  { name: 'reception', path: '/reception', selector: 'app-reception-dashboard, oosm-dashboard' },
  { name: 'storage', path: '/storage', selector: 'oosm-dashboard' },
  { name: 'finance', path: '/finance', selector: 'app-finance-dashboard, oosm-dashboard' },
  { name: 'inventory', path: '/stock/dashboard', selector: 'app-stock-dashboard, oosm-dashboard' },
  { name: 'conditioning OF', path: '/of', selector: 'oosm-dashboard' },
  { name: 'settings', path: '/settings/general-config', selector: 'app-general-config, mat-card' }
];

test.describe('Module navigation', () => {
  test.beforeEach(async ({ page }) => {
    requireLogin(test);
    await login(page);
    await expectAuthenticatedShell(page);
  });

  for (const mod of moduleRoutes) {
    test(`${mod.name} route is reachable`, async ({ page }) => {
      await page.goto(mod.path);
      await expect(page).toHaveURL(new RegExp(mod.path.replace(/\//g, '\\/')));
      await expect(page.locator(mod.selector).first()).toBeVisible({ timeout: 15000 });
    });
  }

  test('help page shows enhanced sections', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('.help-page')).toBeVisible();
    await expect(page.locator('.help-page__nav')).toBeVisible();
    await expect(page.locator('.help-page__modules .help-card').first()).toBeVisible();
    await expect(page.locator('.help-flow')).toBeVisible();
    await expect(page.locator('#help-faq')).toBeVisible();
    await expect(page.locator('#help-pdf')).toBeVisible();
    await expect(page.locator('.help-pdf-grid a[href*="OOSM-Guide-Utilisateur-FR.pdf"]').first()).toBeVisible();
    await expect(page.locator('.help-page__workflows')).toBeVisible();
  });

  test('welcome home dashboard loads', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('app-home-dashboard, .home-dashboard').first()).toBeVisible({ timeout: 15000 });
  });
});

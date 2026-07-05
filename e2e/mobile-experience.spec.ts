import { test, expect } from '@playwright/test';
import { login, requireLogin, expectAuthenticatedShell } from './helpers/auth';
import {
  applyThemeConfigNow,
  expectBodyHasClass,
  openApplicationConfigTab,
  readThemeConfig,
  seedThemeConfig
} from './helpers/theme-config';

const mobileViewport = { width: 390, height: 844 };
const dashboardListPath = '/reception/reception-olive/simple_reception';

test.describe('Mobile experience', () => {
  test.use({ viewport: mobileViewport });

  test.beforeEach(async ({ page }) => {
    requireLogin(test);
    await seedThemeConfig(page);
    await login(page);
    await expectAuthenticatedShell(page);
  });

  test('bottom navigation is visible when enabled on mobile', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('nav.mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('mat-drawer.pc-sidebar')).toHaveCount(0);
    await expectBodyHasClass(page, 'mobile-nav-active', true);
    await expectBodyHasClass(page, 'mobile-bottom-nav-ui', true);
  });

  test('side drawer is used when bottom navigation is disabled', async ({ page }) => {
    await applyThemeConfigNow(page, { mobileBottomNav: false });

    await expect(page.locator('nav.mobile-bottom-nav')).toHaveCount(0);
    await expect(page.locator('mat-drawer.pc-sidebar')).toBeVisible();
    await expectBodyHasClass(page, 'mobile-nav-active', false);
  });

  test('dashboard list uses cards when mobile cards setting is enabled', async ({ page }) => {
    await page.goto(dashboardListPath);
    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.oosm-dashboard-card-view')).toBeVisible();
    await expect(page.locator('.oosm-dashboard-table-view')).toBeHidden();
    await expectBodyHasClass(page, 'mobile-dashboard-cards-ui', true);
  });

  test('dashboard list keeps table when mobile cards setting is disabled', async ({ page }) => {
    await applyThemeConfigNow(page, { mobileDashboardCards: false });
    await page.goto(dashboardListPath);

    await expect(page.locator('oosm-dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.oosm-dashboard-table-view')).toBeVisible();
    await expect(page.locator('.oosm-dashboard-card-view')).toBeHidden();
    await expectBodyHasClass(page, 'mobile-dashboard-cards-ui', false);
  });

  test('bottom nav tabs open module sub-menus', async ({ page }) => {
    await page.goto('/welcome');
    await page.locator('nav.mobile-bottom-nav').getByRole('button', { name: /réception|reception/i }).click();
    await expect(page.locator('app-mobile-module-menu').first()).toBeVisible({ timeout: 10000 });
  });

  test('application config toggles persist after apply', async ({ page }) => {
    await openApplicationConfigTab(page);

    const bottomNavToggle = page.getByTestId('toggle-mobile-bottom-nav');
    const cardsToggle = page.getByTestId('toggle-mobile-dashboard-cards');

    await expect(bottomNavToggle).toBeVisible();
    await expect(cardsToggle).toBeVisible();

    if (await bottomNavToggle.locator('input').isChecked()) {
      await bottomNavToggle.click();
    }
    if (await cardsToggle.locator('input').isChecked()) {
      await cardsToggle.click();
    }

    await page.getByRole('button', { name: /apply|appliquer/i }).click();

    const stored = await readThemeConfig(page);
    expect(stored['mobileBottomNav']).toBe(false);
    expect(stored['mobileDashboardCards']).toBe(false);

    await page.reload();
    await expect(page.getByTestId('toggle-mobile-bottom-nav').locator('input')).not.toBeChecked();
    await expect(page.getByTestId('toggle-mobile-dashboard-cards').locator('input')).not.toBeChecked();
  });
});

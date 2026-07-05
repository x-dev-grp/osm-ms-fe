import { Page, expect } from '@playwright/test';

export type ThemeConfigSeed = {
  mobileBottomNav?: boolean;
  mobileDashboardCards?: boolean;
  liquidGlass?: boolean;
};

export const defaultThemeConfigSeed: ThemeConfigSeed = {
  mobileBottomNav: true,
  mobileDashboardCards: true,
  liquidGlass: false
};

/** Seed localStorage themeConfig before the app bootstraps. */
export async function seedThemeConfig(page: Page, partial: ThemeConfigSeed = {}): Promise<void> {
  const payload = { ...defaultThemeConfigSeed, ...partial };
  await page.addInitScript((cfg) => {
    const existing = JSON.parse(localStorage.getItem('themeConfig') || '{}');
    localStorage.setItem('themeConfig', JSON.stringify({ ...existing, ...cfg }));
  }, payload);
}

export async function readThemeConfig(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('themeConfig') || '{}'));
}

/** Update themeConfig in the current session and reload so the shell reapplies settings. */
export async function applyThemeConfigNow(page: Page, partial: ThemeConfigSeed = {}): Promise<void> {
  await page.evaluate((cfg) => {
    const defaults = {
      layoutType: 'light',
      contrast: false,
      caption: false,
      rtlLayout: false,
      bodyColor: 'blue-theme',
      layout: 'vertical',
      boxLayouts: false,
      liquidGlass: false,
      mobileBottomNav: true,
      mobileDashboardCards: true
    };
    const existing = JSON.parse(localStorage.getItem('themeConfig') || '{}');
    localStorage.setItem('themeConfig', JSON.stringify({ ...defaults, ...existing, ...cfg }));
  }, partial);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

export async function expectBodyHasClass(page: Page, className: string, shouldHave: boolean): Promise<void> {
  const hasClass = await page.evaluate((cls) => document.body.classList.contains(cls), className);
  expect(hasClass).toBe(shouldHave);
}

export async function openApplicationConfigTab(page: Page): Promise<void> {
  await page.goto('/settings/general-config?tab=other');
  await expect(page.locator('app-application-config')).toBeVisible({ timeout: 15000 });
}

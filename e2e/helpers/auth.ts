import { Page, expect } from '@playwright/test';

export const defaultCredentials = {
  username: process.env['E2E_USERNAME'] || 'oosmAdmin',
  password: process.env['E2E_PASSWORD'] || 'osmAdmin123'
};

/** Skip unless backend + login are available */
export function requireLogin(test: typeof import('@playwright/test').test): void {
  test.skip(!process.env["E2E_RUN_LOGIN"], 'Set E2E_RUN_LOGIN=1 with FE+BE running');
}

export async function login(page: Page, creds = defaultCredentials): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('input#username').fill(creds.username);
  await page.locator('input#password').fill(creds.password);
  await page.locator('button.login-button').click();
  await page.waitForURL(/\/(welcome|administration)/, { timeout: 20000 });
}

export async function expectAuthenticatedShell(page: Page): Promise<void> {
  await expect(page.locator('app-nav-bar, .pc-header, mat-toolbar').first()).toBeVisible({ timeout: 10000 });
}

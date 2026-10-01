import { Page, expect } from '@playwright/test';

export interface Credentials {
  username: string;
  password: string;
}

/** Credentials come only from the environment; nothing is stored in the repo. */
export function credentialsFromEnv(prefix = 'E2E'): Credentials | null {
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  return username && password ? { username, password } : null;
}

/** Skip unless backend + login are available */
export function requireLogin(test: typeof import('@playwright/test').test, prefix = 'E2E'): void {
  test.skip(!process.env['E2E_RUN_LOGIN'], 'Set E2E_RUN_LOGIN=1 with FE+BE running');
  test.skip(!credentialsFromEnv(prefix), `Set ${prefix}_USERNAME and ${prefix}_PASSWORD`);
}

export async function login(page: Page, creds: Credentials | null = credentialsFromEnv()): Promise<void> {
  if (!creds) {
    throw new Error('Missing E2E credentials: set E2E_USERNAME and E2E_PASSWORD');
  }
  await page.goto('/auth/login');
  await page.locator('input#username').fill(creds.username);
  await page.locator('input#password').fill(creds.password);
  await page.locator('button.login-button').click();
  await page.waitForURL(/\/(welcome|administration)/, { timeout: 20000 });
}

export async function expectAuthenticatedShell(page: Page): Promise<void> {
  await expect(page.locator('app-nav-bar, .pc-header, mat-toolbar').first()).toBeVisible({ timeout: 10000 });
}

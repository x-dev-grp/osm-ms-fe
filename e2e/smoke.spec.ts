import { test, expect } from '@playwright/test';

const username = process.env.E2E_USERNAME || 'oosmAdmin';
const password = process.env.E2E_PASSWORD || 'osmAdmin123';

test.describe('ZitFlow smoke', () => {
  test('login page shows ZitFlow branding', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('.auth-slogan')).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('successful login reaches home or admin dashboard', async ({ page }) => {
    test.skip(!process.env.E2E_RUN_LOGIN, 'Set E2E_RUN_LOGIN=1 with backend running');

    await page.goto('/auth/login');
    await page.locator('input#username').fill(username);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /login|connexion/i }).click();

    await page.waitForURL(/\/(welcome|administration)/, { timeout: 15000 });
    expect(page.url()).toMatch(/welcome|administration/);
  });

  test('help page loads when authenticated', async ({ page }) => {
    test.skip(!process.env.E2E_RUN_LOGIN, 'Set E2E_RUN_LOGIN=1 with backend running');

    await page.goto('/auth/login');
    await page.locator('input#username').fill(username);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /login|connexion/i }).click();
    await page.waitForURL(/\/(welcome|administration)/, { timeout: 15000 });

    await page.goto('/help');
    await expect(page.locator('.help-page')).toBeVisible();
  });
});

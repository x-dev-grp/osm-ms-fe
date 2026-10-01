import { test, expect } from '@playwright/test';
import { credentialsFromEnv, requireLogin } from './helpers/auth';

const username = credentialsFromEnv()?.username ?? '';
const password = credentialsFromEnv()?.password ?? '';

test.describe('ZitFlow smoke', () => {
  test('login page shows ZitFlow branding', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('.auth-visual__title')).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('successful login reaches home or admin dashboard', async ({ page }) => {
    requireLogin(test);

    await page.goto('/auth/login');
    await page.locator('input#username').fill(username);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /login|connexion/i }).click();

    await page.waitForURL(/\/(welcome|administration)/, { timeout: 15000 });
    expect(page.url()).toMatch(/welcome|administration/);
  });

  test('help page loads when authenticated', async ({ page }) => {
    requireLogin(test);

    await page.goto('/auth/login');
    await page.locator('input#username').fill(username);
    await page.locator('input#password').fill(password);
    await page.getByRole('button', { name: /login|connexion/i }).click();
    await page.waitForURL(/\/(welcome|administration)/, { timeout: 15000 });

    await page.goto('/help');
    await expect(page.locator('.help-page')).toBeVisible();
  });
});

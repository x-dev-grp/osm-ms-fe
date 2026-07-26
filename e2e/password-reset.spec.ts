import { test, expect } from '@playwright/test';
import {
  FAKE_RESET_USER_ID,
  mockResetPassword,
  mockUpdatePassword,
  mockValidateResetCode
} from './helpers/password-reset';

test.describe('Self-service password reset', () => {
  test('forgot-password page shows form and back-to-login', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.locator('h2.text-center')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('button.login-button')).toBeVisible();
    await expect(page.locator('a.forgot-password')).toBeVisible();
  });

  test('login page links to forgot-password', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('a.forgot-password').click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('submit stays disabled for empty email', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.locator('button.login-button')).toBeDisabled();
  });

  test('invalid email shows validation error', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.locator('input#email').fill('not-an-email');
    await page.locator('input#email').blur();
    await expect(page.locator('mat-error').first()).toBeVisible();
    await expect(page.locator('button.login-button')).toBeDisabled();
  });

  test('successful reset request redirects to code screen', async ({ page }) => {
    await mockResetPassword(page, { userId: FAKE_RESET_USER_ID, result: 'ok' });
    await page.goto('/auth/forgot-password');

    await page.locator('input#email').fill('user@example.com');
    await page.locator('button.login-button').click();

    await expect(page).toHaveURL(new RegExp(`/auth/reset/${FAKE_RESET_USER_ID}`));
    await expect(page.locator('input#code')).toBeVisible();
  });

  test('failed reset request shows error alert', async ({ page }) => {
    await mockResetPassword(page, { result: 'fail' });
    await page.goto('/auth/forgot-password');

    await page.locator('input#email').fill('unknown@example.com');
    await page.locator('button.login-button').click();

    await expect(page.locator('.mat-alert.mat-error')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('valid confirmation code advances to password phase', async ({ page }) => {
    await mockValidateResetCode(page, 'ok');
    await page.goto(`/auth/reset/${FAKE_RESET_USER_ID}`);

    await page.locator('input#code').fill('123456');
    await page.locator('button.login-button').click();

    await expect(page.locator('input#newPassword')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
  });

  test('invalid confirmation code shows error and stays on code phase', async ({ page }) => {
    await mockValidateResetCode(page, 'fail');
    await page.goto(`/auth/reset/${FAKE_RESET_USER_ID}`);

    await page.locator('input#code').fill('000000');
    await page.locator('button.login-button').click();

    await expect(page.locator('.mat-alert.mat-error')).toBeVisible();
    await expect(page.locator('input#code')).toBeVisible();
    await expect(page.locator('input#newPassword')).toHaveCount(0);
  });

  test('password mismatch keeps submit disabled', async ({ page }) => {
    await mockValidateResetCode(page, 'ok');
    await page.goto(`/auth/reset/${FAKE_RESET_USER_ID}`);

    await page.locator('input#code').fill('123456');
    await page.locator('button.login-button').click();
    await expect(page.locator('input#newPassword')).toBeVisible();

    await page.locator('input#newPassword').fill('Password1!');
    await page.locator('input#confirmPassword').fill('Password2!');
    await page.locator('input#confirmPassword').blur();

    // Group-level mismatch invalidates the form; Material may not surface mat-error
    await expect(page.locator('button.login-button')).toBeDisabled();
  });

  test('successful password update shows success message', async ({ page }) => {
    await mockValidateResetCode(page, 'ok');
    await mockUpdatePassword(page, 'ok');
    await page.goto(`/auth/reset/${FAKE_RESET_USER_ID}`);

    await page.locator('input#code').fill('123456');
    await page.locator('button.login-button').click();
    await expect(page.locator('input#newPassword')).toBeVisible();

    await page.locator('input#newPassword').fill('Password1!');
    await page.locator('input#confirmPassword').fill('Password1!');
    await page.locator('button.login-button').click();

    await expect(page.locator('.mat-alert.mat-success')).toBeVisible();
  });
});

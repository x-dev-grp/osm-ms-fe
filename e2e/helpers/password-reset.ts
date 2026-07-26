import { Page } from '@playwright/test';

/** Stable fake user id used by mocked self-service reset flows */
export const FAKE_RESET_USER_ID = '11111111-2222-3333-4444-555555555555';

export type MockResult = 'ok' | 'fail';

export async function mockResetPassword(
  page: Page,
  options: { userId?: string; result?: MockResult } = {}
): Promise<void> {
  const userId = options.userId ?? FAKE_RESET_USER_ID;
  const result = options.result ?? 'ok';

  await page.route('**/api/security/user/auth/resetPassword*', async (route) => {
    if (result === 'fail') {
      await route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Invalid input'
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: userId })
    });
  });
}

export async function mockValidateResetCode(page: Page, result: MockResult = 'ok'): Promise<void> {
  await page.route('**/api/security/user/auth/validateResetCode/**', async (route) => {
    if (result === 'fail') {
      await route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Invalid or expired code'
      });
      return;
    }
    await route.fulfill({ status: 200, body: '' });
  });
}

export async function mockUpdatePassword(page: Page, result: MockResult = 'ok'): Promise<void> {
  await page.route('**/api/security/user/auth/updatePassword/**', async (route) => {
    if (result === 'fail') {
      await route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Password update failed'
      });
      return;
    }
    await route.fulfill({ status: 200, body: '' });
  });
}

export async function mockIssueTemporaryPassword(page: Page): Promise<{ waitForCall: () => Promise<void> }> {
  let resolveCall: (() => void) | undefined;
  const called = new Promise<void>((resolve) => {
    resolveCall = resolve;
  });

  await page.route('**/api/security/admin/users/*/issue-temporary-password*', async (route) => {
    resolveCall?.();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: FAKE_RESET_USER_ID })
    });
  });

  return {
    waitForCall: () => called
  };
}

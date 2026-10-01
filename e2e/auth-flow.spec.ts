import { test, expect, Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const userId = '20000000-0000-4000-8000-000000000001';
const tenantId = '10000000-0000-4000-8000-000000000001';
const token = [
  Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
  Buffer.from(
    JSON.stringify({
      sub: 'auth-ui-review',
      exp: 4102444800,
      role: 'ADMIN',
      oosmUser: { id: userId, username: 'auth-ui-review', tenantId, role: 'ADMIN', enabledModules: ['RECEPTION'] }
    })
  ).toString('base64url'),
  'test'
].join('.');

async function setup(page: Page, language = 'fr') {
  await page.addInitScript((lang) => {
    localStorage.setItem('app_language', lang);
  }, language);
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/oauth2/token')) {
      return route.fulfill({
        status: 400,
        json: {
          error: 'access_denied',
          error_description: 'auth-ui-review',
          error_uri: userId
        }
      });
    }
    if (url.pathname.endsWith(`/initial-password/${userId}`) || url.pathname.endsWith(`/updatePassword/${userId}`)) {
      return route.fulfill({ status: 200, body: '' });
    }
    if (url.pathname.endsWith(`/validateResetCode/${userId}`)) {
      return route.fulfill({ status: 200, body: '' });
    }
    if (url.pathname.endsWith('/me/change-password')) {
      return route.fulfill({ status: 200, body: '' });
    }
    if (url.pathname.endsWith('/api/security/user/me')) {
      return route.fulfill({ json: { id: userId, username: 'auth-ui-review', tenantId, role: 'ADMIN', email: 'review@example.invalid', confirmationMethod: 'EMAIL' } });
    }
    if (url.pathname.endsWith('/refresh-session')) {
      return route.fulfill({ json: { access_token: token, authorities: [], enabledModules: ['RECEPTION'] } });
    }
    if (url.pathname.startsWith('/api/')) {
      return route.fulfill({ json: { success: true, data: [], content: [] } });
    }
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.abort();
  });
}

for (const [language, expected] of [
  ['fr', 'Votre mot de passe a été modifié'],
  ['en', 'Your password was changed'],
  ['ar', 'تم تغيير كلمة المرور']
]) {
  test(`first password creation returns to sign-in in ${language}`, async ({ page }) => {
    await setup(page, language);
    await page.goto('/auth/login');
    await page.locator('#username').fill('auth-ui-review');
    await page.locator('#password').fill('Temporary1!');
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/\/auth\/user\/update-password/);
    await expect(page.locator('#newPass')).toHaveAttribute('type', 'password');
    await expect(page.locator('#conPass')).toHaveAttribute('type', 'password');
    await page.locator('#newPass').fill('NewPassword1!');
    await page.locator('#conPass').fill('NewPassword1!');
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/\/auth\/login\?success=password-changed/);
    await expect(page.locator('.auth-alert--success')).toContainText(expected);
    await expect(page.locator('.auth-alert--error')).toHaveCount(0);
  });
}

test('reset mismatch explains the disabled button, then returns to sign-in', async ({ page }) => {
  await setup(page);
  await page.goto(`/auth/reset/${userId}`);
  await expect(page.locator('.auth-panel__card')).not.toContainText('RESET_PASSWORD.');
  await page.locator('#code').fill('123456');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('#newPassword')).toBeVisible();
  await page.locator('#newPassword').fill('NewPassword1!');
  await page.locator('#confirmPassword').fill('Different1!');
  await expect(page.getByText('Les mots de passe ne correspondent pas')).toBeVisible();
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  await page.locator('#confirmPassword').fill('NewPassword1!');
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/auth\/login\?success=password-changed/);
  await expect(page.locator('.auth-alert--success')).toBeVisible();
});

test('ordinary access denial shows a clear localized sign-in error', async ({ page }) => {
  await setup(page);
  await page.route('**/oauth2/token', (route) => route.fulfill({ status: 400, json: { error: 'access_denied' } }));
  await page.goto('/auth/login');
  await page.locator('#username').fill('auth-ui-review');
  await page.locator('#password').fill('wrong');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('.auth-alert--error')).toContainText('Vérifiez vos identifiants');
  await expect(page.locator('.auth-alert--error')).not.toContainText('access_denied');
});

test('access-denied logout clears the session', async ({ page }) => {
  await setup(page);
  await page.addInitScript((accessToken) => sessionStorage.setItem('auth_token', accessToken), token);
  await page.goto('/access-denied');
  await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(await page.evaluate(() => sessionStorage.getItem('auth_token'))).toBeNull();
});

test('changing the current password signs out and shows a success message', async ({ page }) => {
  await setup(page);
  await page.addInitScript((accessToken) => sessionStorage.setItem('auth_token', accessToken), token);
  await page.goto('/account/profile');
  await page.getByRole('tab', { name: /Changer le mot de passe/ }).click();
  await page.locator('#oldPassword').fill('CurrentPassword1!');
  await page.locator('#newPassword').fill('NewPassword1!');
  await page.locator('#confirmPassword').fill('NewPassword1!');
  await page.getByRole('button', { name: /Mettre à jour le mot de passe/ }).click();
  await expect(page).toHaveURL(/\/auth\/login\?success=password-changed/);
  await expect(page.locator('.auth-alert--success')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('auth_token'))).toBeNull();
});

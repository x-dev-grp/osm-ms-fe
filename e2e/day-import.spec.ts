import { test, expect } from '@playwright/test';

const tenantId = '10000000-0000-4000-8000-000000000001';
const runId = '20000000-0000-4000-8000-000000000001';
const token = [
  Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
  Buffer.from(
    JSON.stringify({
      sub: 'import-ui-test',
      exp: 4102444800,
      role: 'ADMIN',
      authorities: ['RECEPTION:UNIFIEDDELIVERY:CREATE'],
      oosmUser: {
        id: '30000000-0000-4000-8000-000000000001',
        username: 'import-ui-test',
        tenantId,
        role: 'ADMIN',
        enabledModules: ['RECEPTION', 'FINANCE', 'PRODUCTION']
      }
    })
  ).toString('base64url'),
  'test'
].join('.');
const preview = {
  runId,
  outcome: 'PREVIEW',
  businessDate: '2026-09-05',
  canCommit: true,
  validCount: 1,
  invalidCount: 0,
  totalRows: 1,
  rows: [{ sheet: 'Expenses', rowNumber: 2, businessKey: 'E1', status: 'CREATE', message: '' }]
};

async function prepare(page: import('@playwright/test').Page, lang: string, reject = false) {
  await page.addInitScript(
    ({ token, lang }) => {
      sessionStorage.setItem('auth_token', token);
      localStorage.setItem('app_language', lang);
      localStorage.setItem('app_theme', 'dark');
      localStorage.setItem(
        'oosm.tours.v1.30000000-0000-4000-8000-000000000001',
        JSON.stringify(['SHELL@1', 'RECEPTION_IMPORT@2'])
      );
    },
    { token, lang }
  );
  // Never send the synthetic test token to a real API. All nonlocal requests are fulfilled or aborted.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/api/')) {
      if (url.pathname.endsWith('/refresh-session'))
        return route.fulfill({ json: { access_token: token, enabledModules: ['RECEPTION', 'FINANCE', 'PRODUCTION'] } });
      if (url.pathname.endsWith('/import/day/dry-run')) return route.fulfill({ json: { success: true, data: preview } });
      if (url.pathname.endsWith('/import/day/commit')) {
        expect(url.searchParams.get('previewId')).toBe(runId);
        return route.fulfill({
          status: reject ? 422 : 200,
          json: {
            success: !reject,
            message: 'Validation rejected',
            data: { ...preview, outcome: reject ? 'REJECTED' : 'COMMITTED', invalidCount: reject ? 1 : 0 }
          }
        });
      }
      if (url.pathname.endsWith('/import/day/drive/status'))
        return route.fulfill({ json: { success: true, data: { configured: false, connected: false, oauthConfigured: false } } });
      return route.fulfill({ json: { success: true, data: [], content: [], totalElements: 0 } });
    }
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
    return route.abort();
  });
  await page.goto('/reception/import');
  await page.getByRole('checkbox').check();
}

for (const [lang, title] of [
  ['fr', 'Import journalier Excel'],
  ['en', 'Daily Excel import'],
  ['ar', 'الاستيراد اليومي من Excel']
]) {
  test(`import page resolves ${lang} translations`, async ({ page }) => {
    await prepare(page, lang);
    await expect(page.locator('.day-import h1')).toHaveText(title);
    await expect(page.locator('.day-import')).not.toContainText('ABIOOC.DAY_IMPORT');
  });
}

test('French import binds preview and disables commit after success', async ({ page }) => {
  await prepare(page, 'fr');
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'review.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock workbook')
    });
  await page.getByRole('button', { name: 'Vérifier sans importer', exact: true }).click();
  await expect(page.locator('.day-import__table').first()).toContainText('À créer');
  const commit = page.getByRole('button', { name: 'Importer les données validées', exact: true });
  await commit.click();
  await expect(commit).toBeDisabled();
  await expect(page.locator('.day-import [role=status]')).toHaveText('Import terminé.');
});

test('rejected import does not show a success message', async ({ page }) => {
  await prepare(page, 'fr', true);
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'review.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock workbook')
    });
  await page.getByRole('button', { name: 'Vérifier sans importer', exact: true }).click();
  await page.getByRole('button', { name: 'Importer les données validées', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Importer les données validées', exact: true })).toBeDisabled();
  await expect(page.locator('.day-import')).not.toContainText('Import terminé.');
});

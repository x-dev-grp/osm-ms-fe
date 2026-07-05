import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] || 'http://localhost:4200';
const isCi = !!process.env['CI'];

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  reporter: isCi ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: isCi
    ? {
        command: 'npx http-server dist/ui -p 4200 -a 127.0.0.1 -c-1',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000
      }
    : {
        command: 'npm run start:local',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile-experience\.spec\.ts/
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /mobile-experience\.spec\.ts/
    }
  ]
});

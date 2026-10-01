import { test as base, expect } from '@playwright/test';

type ApiErrorOptions = {
  /** URL patterns whose 403/5xx responses a test expects and should not fail on. */
  allowedApiErrors: RegExp[];
};

/**
 * Fails the test when any backend call is refused (403) or crashes (5xx),
 * so pages that "render" with an empty dropdown or list still surface the error.
 * Use only in specs that run against a live backend: without one, the dev proxy answers /api with 5xx.
 */
export const test = base.extend<ApiErrorOptions & { apiErrors: string[] }>({
  allowedApiErrors: [[], { option: true }],

  apiErrors: [
    async ({ page, allowedApiErrors }, use) => {
      const errors: string[] = [];
      page.on('response', (response) => {
        const status = response.status();
        const url = response.url();
        if (!url.includes('/api/') || (status !== 403 && status < 500)) {
          return;
        }
        if (allowedApiErrors.some((pattern) => pattern.test(url))) {
          return;
        }
        errors.push(`${status} ${response.request().method()} ${url}`);
      });

      await use(errors);

      expect(errors, 'Backend calls refused (403) or failed (5xx) during the test').toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };

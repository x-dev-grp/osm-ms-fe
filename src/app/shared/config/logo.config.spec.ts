import { APP_LOGO_FULL, APP_LOGO_MARK, APP_SLOGAN_KEY } from './logo.config';

describe('logo.config', () => {
  it('should point to the dark circle + gold drop branding assets', () => {
    expect(APP_LOGO_MARK).toBe('assets/logos/oosm-olive-02-mark.svg');
    expect(APP_LOGO_FULL).toBe('assets/logos/oosm-olive-banner-02.svg');
  });

  it('should expose the slogan i18n key', () => {
    expect(APP_SLOGAN_KEY).toBe('BRANDING.SLOGAN');
  });
});

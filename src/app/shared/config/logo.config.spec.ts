import { APP_FONT_FAMILY, APP_LOGO_FULL, APP_LOGO_MARK, APP_SLOGAN_KEY } from './logo.config';

describe('logo.config', () => {
  it('exposes ZitFlow mark and lockup asset paths', () => {
    expect(APP_LOGO_MARK).toBe('assets/logos/zitflow-mark.png');
    expect(APP_LOGO_FULL).toBe('assets/logos/zitflow-lockup.png');
  });

  it('exposes branding slogan i18n key', () => {
    expect(APP_SLOGAN_KEY).toBe('BRANDING.SLOGAN');
  });

  it('exposes Quicksand brand font stack', () => {
    expect(APP_FONT_FAMILY).toContain('Quicksand');
  });
});

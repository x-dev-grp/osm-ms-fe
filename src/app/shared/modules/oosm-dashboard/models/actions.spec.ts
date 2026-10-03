import { ACTION_ICONS, isDashboardActionVisible } from './actions';

describe('dashboard action icons', () => {
  it('hides QR regeneration from row action menus', () => {
    expect(isDashboardActionVisible('REGENERATE_QR')).toBeFalse();
    expect(ACTION_ICONS.has('REGENERATE_QR')).toBeFalse();
  });

  it('keeps other actions visible', () => {
    expect(isDashboardActionVisible('READ')).toBeTrue();
    expect(isDashboardActionVisible('GEN_PDF_QC_OLIVE')).toBeTrue();
  });
});

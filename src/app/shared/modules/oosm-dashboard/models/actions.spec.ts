import { ACTION_ICONS } from './actions';

describe('dashboard action icons', () => {
  it('shows a QR icon for QR regeneration', () => {
    expect(ACTION_ICONS.get('REGENERATE_QR')).toBe('qr_code_2');
  });
});

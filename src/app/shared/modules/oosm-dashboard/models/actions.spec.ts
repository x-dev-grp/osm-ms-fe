import { ACTION_ICONS } from './actions';

describe('dashboard action icons', () => {
  it('shows a QR icon for QR regeneration', () => {
    expect(ACTION_ICONS.get('REGENERATE_QR')).toBe('qr_code_2');
  });

  it('distinguishes inbound and outbound stock actions', () => {
    expect(ACTION_ICONS.get('ENTREE_STOCK')).toBe('call_received');
    expect(ACTION_ICONS.get('SORTIE_STOCK')).toBe('call_made');
  });
});

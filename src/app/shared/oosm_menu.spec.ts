import { oosm_menus } from './oosm_menu';
import { Navigation } from '../theme/types/navigation';

describe('OOSM conditioning menu permissions', () => {
  const group = (id: string): Navigation => {
    const result = oosm_menus.find((item) => item.id === id);
    expect(result).toBeDefined();
    return result!;
  };

  const child = (parent: Navigation, id: string): Navigation | undefined =>
    parent.children?.find((item) => item.id === id);

  it('keeps packaging inventory inside the conditioning module', () => {
    const conditioning = group('group-conditioning');
    const stock = child(conditioning, 'collapse-conditioning-stock-operations');

    expect(conditioning.modulePermission).toBe('CONDITIONING');
    expect(stock?.children?.map((item) => item.id)).toEqual([
      'item-stocks-mouvements',
      'item-stocks-emplacements',
      'item-stocks-par-emplacement'
    ]);
    expect(stock?.children?.every((item) => item.permissions?.every((permission) => permission.startsWith('CONDITIONING:')))).toBeTrue();
    expect(child(group('group-inventory'), 'collapse-stock-operations')).toBeUndefined();
  });

  it('places oil filtration under conditioning permissions', () => {
    const conditioning = group('group-conditioning');
    const workshop = child(conditioning, 'collapse-conditioning-workshop');
    const filtration = child(workshop!, 'item-conditioning-oil-filtering');

    expect(filtration?.permissions).toEqual(['CONDITIONING:FILTRATIONOPERATION:READ']);
    const storage = child(group('group-production'), 'collapse-production-storage');
    expect(child(storage!, 'item-storage-oil-filtering')).toBeUndefined();
  });
});

import { oosm_menus } from './oosm_menu';
import { Navigation } from '../theme/types/navigation';

describe('OOSM menu business structure', () => {
  const group = (id: string): Navigation => {
    const result = oosm_menus.find((item) => item.id === id);
    expect(result).toBeDefined();
    return result!;
  };

  const child = (parent: Navigation, id: string): Navigation | undefined =>
    parent.children?.find((item) => item.id === id);

  it('groups conditioning operations and packaging inventory by user workflow', () => {
    const conditioning = group('group-conditioning');
    const operations = child(conditioning, 'collapse-conditioning-operations');
    const inventory = child(conditioning, 'collapse-conditioning-stock-operations');

    expect(operations?.children?.map((item) => item.id)).toEqual([
      'item-conditioning-of',
      'item-conditioning-lines',
      'item-conditioning-oil-filtering'
    ]);
    expect(inventory?.children?.map((item) => item.id)).toEqual([
      'item-stocks-mouvements',
      'item-stocks-emplacements',
      'item-stocks-par-emplacement'
    ]);
  });

  it('keeps purchasing separate from conditioning inventory', () => {
    const purchasing = group('group-inventory');
    expect(purchasing.title).toBe('MENU.STOCKS_INV.PURCHASING');
    expect(purchasing.children?.map((item) => item.id)).toEqual([
      'item-stocks-bons-commande',
      'item-stocks-fournisseurs'
    ]);
  });

  it('places maintenance in mill operations and audit in administration', () => {
    expect(child(group('group-production'), 'collapse-production-maintenance')).toBeDefined();
    expect(oosm_menus.find((item) => item.id === 'group-maintenance-equipment')).toBeUndefined();
    expect(child(group('group-settings'), 'item-conditioning-audit')).toBeDefined();
    expect(child(group('group-pilotage'), 'collapse-pilotage-conditioning')?.children
      ?.some((item) => item.id === 'item-conditioning-audit')).toBeFalse();
  });

  it('flattens high-frequency reception creation choices', () => {
    const reception = group('group-reception');
    const operations = child(reception, 'collapse-reception-new');
    expect(child(operations!, 'collapse-reception-olive')).toBeUndefined();
    expect(operations?.children?.map((item) => item.id)).toEqual([
      'item-reception-olive-simple',
      'item-reception-olive-base',
      'item-reception-olive-purchase',
      'item-reception-olive-exchange',
      'item-reception-oil'
    ]);
  });
});

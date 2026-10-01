import { filterMenuByPermissions } from './menu-permission.filter';
import { Navigation } from 'src/app/theme/types/navigation';

describe('filterMenuByPermissions — tenant modules', () => {
  const menus: Navigation[] = [
    {
      id: 'group-conditioning',
      title: 'Conditioning',
      type: 'group',
      modulePermission: 'CONDITIONING',
      children: [
        {
          id: 'item-of',
          title: 'OF',
          type: 'item',
          url: '/of',
          permissions: ['CONDITIONING:OF:READ']
        },
        {
          id: 'item-lines',
          title: 'Lines',
          type: 'item',
          url: '/stock/lignes',
          modulePermission: 'CONDITIONING',
          permissions: ['CONDITIONING:LIGNECONDITIONNEMENT:READ']
        },
        {
          id: 'item-stock-operations',
          title: 'Stock operations',
          type: 'item',
          url: '/stock/mouvements',
          permissions: ['CONDITIONING:MOUVEMENTSTOCKSEC:READ']
        },
        {
          id: 'item-oil-filtering',
          title: 'Oil filtration',
          type: 'item',
          url: '/storage/oil-filtering',
          permissions: ['CONDITIONING:FILTRATIONOPERATION:READ']
        }
      ]
    },
    {
      id: 'group-inventory',
      title: 'Inventory',
      type: 'group',
      modulePermission: 'INVENTAIR',
      children: [
        {
          id: 'item-articles',
          title: 'Articles',
          type: 'item',
          url: '/stock/articles',
          permissions: ['INVENTAIR:ARTICLESEC:READ']
        }
      ]
    },
    {
      id: 'group-dashboard',
      title: 'Dashboard',
      type: 'group',
      children: [
        {
          id: 'item-dashboard',
          title: 'Home',
          type: 'item',
          url: '/dashboard'
        }
      ]
    }
  ];

  const allPermissions = [
    'CONDITIONING:OF:READ',
    'CONDITIONING:MOUVEMENTSTOCKSEC:READ',
    'CONDITIONING:FILTRATIONOPERATION:READ',
    'CONDITIONING:LIGNECONDITIONNEMENT:READ',
    'INVENTAIR:ARTICLESEC:READ'
  ];

  it('hides conditioning group when CONDITIONING module is off', () => {
    const result = filterMenuByPermissions(menus, allPermissions, {
      enabledModules: ['INVENTAIR'],
      bypassPermissionChecks: true
    });
    expect(result.map((m) => m.id)).toEqual(['group-inventory', 'group-dashboard']);
  });

  it('hides inventory group when INVENTAIR module is off', () => {
    const result = filterMenuByPermissions(menus, allPermissions, {
      enabledModules: ['CONDITIONING'],
      bypassPermissionChecks: true
    });
    expect(result.map((m) => m.id)).toEqual(['group-conditioning', 'group-dashboard']);
    const conditioning = result.find((m) => m.id === 'group-conditioning');
    expect(conditioning?.children?.map((c) => c.id)).toEqual([
      'item-of',
      'item-lines',
      'item-stock-operations',
      'item-oil-filtering'
    ]);
  });

  it('shows all conditioning entries without the inventory module', () => {
    const result = filterMenuByPermissions(menus, allPermissions, {
      enabledModules: ['CONDITIONING', 'INVENTAIR'],
      bypassPermissionChecks: true
    });
    const conditioning = result.find((m) => m.id === 'group-conditioning');
    expect(conditioning?.children?.map((c) => c.id)).toEqual([
      'item-of',
      'item-lines',
      'item-stock-operations',
      'item-oil-filtering'
    ]);
  });

  it('hides all module groups when enabledModules is empty', () => {
    const result = filterMenuByPermissions(menus, allPermissions, {
      enabledModules: [],
      bypassPermissionChecks: true
    });
    expect(result.map((m) => m.id)).toEqual(['group-dashboard']);
  });

  it('still applies RBAC when modules are enabled', () => {
    const result = filterMenuByPermissions(menus, ['CONDITIONING:OF:READ'], {
      enabledModules: ['CONDITIONING', 'INVENTAIR'],
      bypassPermissionChecks: false
    });
    const conditioning = result.find((m) => m.id === 'group-conditioning');
    expect(conditioning?.children?.map((c) => c.id)).toEqual(['item-of']);
    expect(result.find((m) => m.id === 'group-inventory')).toBeUndefined();
  });
});

describe('filterMenuByPermissions — legacy permission keys', () => {
  const menus: Navigation[] = [
    {
      id: 'group-conditioning',
      title: 'Conditioning',
      type: 'group',
      modulePermission: ['CONDITIONING', 'INVENTAIR', 'PRODUCTION'],
      children: [
        { id: 'item-of', title: 'OF', type: 'item', url: '/of', permissions: ['CONDITIONING:OF:READ'] },
        {
          id: 'item-stock-operations',
          title: 'Stock operations',
          type: 'item',
          url: '/stock/mouvements',
          permissions: ['CONDITIONING:MOUVEMENTSTOCKSEC:READ']
        },
        {
          id: 'item-oil-filtering',
          title: 'Oil filtration',
          type: 'item',
          url: '/storage/oil-filtering',
          permissions: ['CONDITIONING:FILTRATIONOPERATION:READ']
        }
      ]
    },
    {
      id: 'group-production',
      title: 'Production',
      type: 'group',
      modulePermission: 'PRODUCTION',
      children: [
        { id: 'item-storage', title: 'Storage', type: 'item', url: '/storage', ressourcePermission: 'STORAGEUNIT' }
      ]
    },
    {
      id: 'group-finance',
      title: 'Finance',
      type: 'group',
      modulePermission: 'FINANCE',
      children: [
        { id: 'item-oil-credit', title: 'Oil credit', type: 'item', url: '/finance/oil-credit', permissions: ['FINANCE:OILCREDIT:READ'] }
      ]
    }
  ];

  it('shows renamed entries to roles holding the former keys under the former modules', () => {
    const result = filterMenuByPermissions(
      menus,
      ['INVENTAIR:MOUVEMENTSTOCKSEC:READ', 'PRODUCTION:STORAGEUNIT:READ', 'PRODUCTION:OILCREDIT:READ'],
      { enabledModules: ['INVENTAIR', 'PRODUCTION', 'FINANCE'] }
    );
    expect(result.find((m) => m.id === 'group-conditioning')?.children?.map((c) => c.id)).toEqual([
      'item-stock-operations',
      'item-oil-filtering'
    ]);
    expect(result.find((m) => m.id === 'group-finance')?.children?.map((c) => c.id)).toEqual(['item-oil-credit']);
  });

  it('keeps entries gated by the module of the key that grants them', () => {
    const result = filterMenuByPermissions(menus, [], { enabledModules: ['PRODUCTION'], bypassPermissionChecks: true });
    expect(result.find((m) => m.id === 'group-conditioning')?.children?.map((c) => c.id)).toEqual(['item-oil-filtering']);
  });

  it('does not grant storage units from the filtration key', () => {
    const result = filterMenuByPermissions(menus, ['CONDITIONING:FILTRATIONOPERATION:READ'], {
      enabledModules: ['CONDITIONING', 'PRODUCTION']
    });
    expect(result.find((m) => m.id === 'group-production')).toBeUndefined();
    expect(result.find((m) => m.id === 'group-conditioning')?.children?.map((c) => c.id)).toEqual(['item-oil-filtering']);
  });
});

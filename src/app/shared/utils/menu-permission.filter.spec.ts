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
          permissions: ['INVENTAIR:LIGNECONDITIONNEMENT:READ']
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
    'INVENTAIR:LIGNECONDITIONNEMENT:READ',
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
    // Lines need inventair as well (cross-module permission)
    expect(conditioning?.children?.map((c) => c.id)).toEqual(['item-of']);
  });

  it('shows lines only when both CONDITIONING and INVENTAIR are on', () => {
    const result = filterMenuByPermissions(menus, allPermissions, {
      enabledModules: ['CONDITIONING', 'INVENTAIR'],
      bypassPermissionChecks: true
    });
    const conditioning = result.find((m) => m.id === 'group-conditioning');
    expect(conditioning?.children?.map((c) => c.id)).toEqual(['item-of', 'item-lines']);
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

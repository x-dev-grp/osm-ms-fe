import { Navigation } from 'src/app/theme/types/navigation';

export interface MenuPermissionFilterOptions {
  bypassPermissionChecks?: boolean;
  enabledModules?: string[];
}

function normalizePermissions(userPermissions: unknown): Set<string> {
  if (!userPermissions) {
    return new Set();
  }
  const list = Array.isArray(userPermissions) ? userPermissions : [userPermissions];
  return new Set(list.map((p) => String(p).toUpperCase()));
}

function enabledModuleSet(enabledModules?: string[]): Set<string> {
  return new Set((enabledModules ?? []).map((module) => module.toUpperCase()));
}

function tenantHasModule(module: string | undefined, enabled: Set<string>): boolean {
  if (!module) {
    return true;
  }
  if (enabled.size === 0) {
    return false;
  }
  return enabled.has(module.toUpperCase());
}

function resolveItemModule(item: Navigation): string | undefined {
  if (item.modulePermission) {
    return item.modulePermission;
  }
  const permission = item.permissions?.find((entry) => entry.includes(':'));
  if (permission) {
    return permission.split(':')[0];
  }
  return undefined;
}

function itemModuleEnabled(item: Navigation, enabled: Set<string>): boolean {
  const module = resolveItemModule(item);
  return tenantHasModule(module, enabled);
}

function hasModuleAccess(permissionSet: Set<string>, module: string): boolean {
  const prefix = `${module.toUpperCase()}:`;
  return [...permissionSet].some((p) => p.startsWith(prefix));
}

function hasEntityAccess(permissionSet: Set<string>, entity: string, module?: string): boolean {
  const entityUpper = entity.toUpperCase();
  const moduleUpper = module?.toUpperCase();
  return [...permissionSet].some((p) => {
    const [mod, ent] = p.split(':');
    if (!ent) {
      return false;
    }
    if (moduleUpper && mod !== moduleUpper) {
      return false;
    }
    return ent === entityUpper;
  });
}

function menuItemHasAccess(
  item: Navigation,
  permissionSet: Set<string>,
  enabled: Set<string>,
  bypassPermissionChecks: boolean
): boolean {
  if (!itemModuleEnabled(item, enabled)) {
    return false;
  }

  if (bypassPermissionChecks) {
    return true;
  }

  if (item.permissions?.length) {
    return item.permissions.some((p) => permissionSet.has(p.toUpperCase()));
  }

  if (item.modulePermission && item.ressourcePermission) {
    return hasEntityAccess(permissionSet, item.ressourcePermission, item.modulePermission);
  }

  if (item.modulePermission) {
    return hasModuleAccess(permissionSet, item.modulePermission);
  }

  if (item.ressourcePermission) {
    return hasEntityAccess(permissionSet, item.ressourcePermission);
  }

  return true;
}

function filterMenuItem(
  item: Navigation,
  permissionSet: Set<string>,
  enabled: Set<string>,
  bypassPermissionChecks: boolean
): Navigation | null {
  const copy: Navigation = { ...item, hidden: false, disabled: false };

  if (copy.children?.length) {
    copy.children = copy.children
      .map((child) => filterMenuItem(child, permissionSet, enabled, bypassPermissionChecks))
      .filter((child): child is Navigation => child !== null);
  }

  if (copy.type === 'group' || copy.type === 'collapse') {
    if (!menuItemHasAccess(copy, permissionSet, enabled, bypassPermissionChecks)) {
      return null;
    }
    if (!copy.children?.length) {
      return null;
    }
    return copy;
  }

  if (copy.type === 'item') {
    return menuItemHasAccess(copy, permissionSet, enabled, bypassPermissionChecks) ? copy : null;
  }

  return null;
}

/**
 * Removes menu entries the user cannot access (instead of disabling them).
 * Tenant admins bypass permission checks but still respect enabled tenant modules.
 */
export function filterMenuByPermissions(
  menuItems: Navigation[],
  userPermissions: unknown,
  options: MenuPermissionFilterOptions | boolean = {}
): Navigation[] {
  const resolved: MenuPermissionFilterOptions =
    typeof options === 'boolean' ? { bypassPermissionChecks: options } : options;

  const permissionSet = normalizePermissions(userPermissions);
  const enabled = enabledModuleSet(resolved.enabledModules);
  const bypassPermissionChecks = resolved.bypassPermissionChecks ?? false;

  return menuItems
    .map((item) => filterMenuItem(item, permissionSet, enabled, bypassPermissionChecks))
    .filter((item): item is Navigation => item !== null);
}

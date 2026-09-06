import { Navigation } from 'src/app/theme/types/navigation';

export interface MenuPermissionFilterOptions {
  bypassPermissionChecks?: boolean;
  enabledModules?: string[];
  /** Navigation item ids to remove regardless of permissions (e.g. feature flags). */
  excludedItemIds?: string[];
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

/** Module declared by the first MODULE:ENTITY:ACTION permission, if any. */
function permissionModule(item: Navigation): string | undefined {
  const permission = item.permissions?.find((entry) => entry.includes(':'));
  if (!permission) {
    return undefined;
  }
  return permission.split(':')[0]?.toUpperCase();
}

/**
 * Module used to show/hide the entry from tenant activation.
 * Prefer explicit modulePermission, then the parent group's module, then the permission prefix.
 */
function resolveMenuModule(item: Navigation, inheritedModule?: string): string | undefined {
  if (item.modulePermission) {
    return item.modulePermission.toUpperCase();
  }
  if (inheritedModule) {
    return inheritedModule.toUpperCase();
  }
  return permissionModule(item);
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
  bypassPermissionChecks: boolean,
  inheritedModule?: string
): boolean {
  const menuModule = resolveMenuModule(item, inheritedModule);
  if (!tenantHasModule(menuModule, enabled)) {
    return false;
  }

  // Cross-module permission (e.g. inventair ligne under conditioning menu):
  // the permission's own module must also be activated.
  const permModule = permissionModule(item);
  if (permModule && menuModule && permModule !== menuModule && !tenantHasModule(permModule, enabled)) {
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
    return hasEntityAccess(permissionSet, item.ressourcePermission, inheritedModule);
  }

  return true;
}

function filterMenuItem(
  item: Navigation,
  permissionSet: Set<string>,
  enabled: Set<string>,
  bypassPermissionChecks: boolean,
  excludedItemIds: Set<string>,
  inheritedModule?: string
): Navigation | null {
  if (item.id && excludedItemIds.has(item.id)) {
    return null;
  }

  if (!menuItemHasAccess(item, permissionSet, enabled, bypassPermissionChecks, inheritedModule)) {
    return null;
  }

  const copy: Navigation = { ...item, hidden: false, disabled: false };
  const childInheritedModule = (item.modulePermission ?? inheritedModule)?.toUpperCase();

  if (copy.children?.length) {
    copy.children = copy.children
      .map((child) =>
        filterMenuItem(child, permissionSet, enabled, bypassPermissionChecks, excludedItemIds, childInheritedModule)
      )
      .filter((child): child is Navigation => child !== null);
  }

  if (copy.type === 'group' || copy.type === 'collapse') {
    if (!copy.children?.length) {
      return null;
    }
    return copy;
  }

  if (copy.type === 'item') {
    return copy;
  }

  return null;
}

/**
 * Removes menu entries the user cannot access (instead of disabling them).
 * Visibility is driven first by tenant-enabled modules, then by RBAC permissions.
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
  const excludedItemIds = new Set(resolved.excludedItemIds ?? []);

  return menuItems
    .map((item) => filterMenuItem(item, permissionSet, enabled, bypassPermissionChecks, excludedItemIds))
    .filter((item): item is Navigation => item !== null);
}

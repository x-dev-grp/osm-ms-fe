import { Navigation } from 'src/app/theme/types/navigation';
import { expandGrantedPermissions, grantingPermissionKeys } from 'src/app/theme/types/permissions';

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
  return expandGrantedPermissions(list.map((p) => String(p)));
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

function toModuleList(modules: string | string[] | undefined): string[] {
  if (!modules) {
    return [];
  }
  return (Array.isArray(modules) ? modules : [modules]).map((module) => module.toUpperCase());
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
 * Modules used to show/hide the entry from tenant activation (any of them is enough).
 * Prefer explicit modulePermission, then the parent group's modules, then the permission prefix.
 */
function resolveMenuModules(item: Navigation, inheritedModules: string[]): string[] {
  const explicit = toModuleList(item.modulePermission);
  if (explicit.length) {
    return explicit;
  }
  if (inheritedModules.length) {
    return inheritedModules;
  }
  return toModuleList(permissionModule(item));
}

function hasModuleAccess(permissionSet: Set<string>, modules: string[]): boolean {
  const prefixes = modules.map((module) => `${module}:`);
  return [...permissionSet].some((p) => prefixes.some((prefix) => p.startsWith(prefix)));
}

function hasEntityAccess(permissionSet: Set<string>, entity: string, modules: string[]): boolean {
  const entityUpper = entity.toUpperCase();
  return [...permissionSet].some((p) => {
    const [mod, ent] = p.split(':');
    if (!ent) {
      return false;
    }
    if (modules.length && !modules.includes(mod)) {
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
  inheritedModules: string[]
): boolean {
  const menuModules = resolveMenuModules(item, inheritedModules);
  if (menuModules.length && !menuModules.some((module) => tenantHasModule(module, enabled))) {
    return false;
  }

  // A permission only counts when its own module is activated (e.g. inventair ligne under conditioning menu).
  const grantingKeys = (item.permissions ?? [])
    .flatMap((permission) => grantingPermissionKeys(permission))
    .filter((key) => !key.includes(':') || tenantHasModule(key.split(':')[0], enabled));
  if (item.permissions?.length && !grantingKeys.length) {
    return false;
  }

  if (bypassPermissionChecks) {
    return true;
  }

  if (item.permissions?.length) {
    return grantingKeys.some((key) => permissionSet.has(key));
  }

  const explicitModules = toModuleList(item.modulePermission);

  if (explicitModules.length && item.ressourcePermission) {
    return hasEntityAccess(permissionSet, item.ressourcePermission, explicitModules);
  }

  if (explicitModules.length) {
    return hasModuleAccess(permissionSet, explicitModules);
  }

  if (item.ressourcePermission) {
    return hasEntityAccess(permissionSet, item.ressourcePermission, inheritedModules);
  }

  return true;
}

function filterMenuItem(
  item: Navigation,
  permissionSet: Set<string>,
  enabled: Set<string>,
  bypassPermissionChecks: boolean,
  excludedItemIds: Set<string>,
  inheritedModules: string[] = []
): Navigation | null {
  if (item.id && excludedItemIds.has(item.id)) {
    return null;
  }

  if (!menuItemHasAccess(item, permissionSet, enabled, bypassPermissionChecks, inheritedModules)) {
    return null;
  }

  const copy: Navigation = { ...item, hidden: false, disabled: false };
  const explicitModules = toModuleList(item.modulePermission);
  const childInheritedModules = explicitModules.length ? explicitModules : inheritedModules;

  if (copy.children?.length) {
    copy.children = copy.children
      .map((child) =>
        filterMenuItem(child, permissionSet, enabled, bypassPermissionChecks, excludedItemIds, childInheritedModules)
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

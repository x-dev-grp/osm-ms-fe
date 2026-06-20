import { Navigation } from 'src/app/theme/types/navigation';

function normalizePermissions(userPermissions: unknown): Set<string> {
  if (!userPermissions) {
    return new Set();
  }
  const list = Array.isArray(userPermissions) ? userPermissions : [userPermissions];
  return new Set(list.map((p) => String(p).toUpperCase()));
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

function menuItemHasAccess(item: Navigation, permissionSet: Set<string>): boolean {
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

  // No permission metadata — keep visible (legacy entries)
  return true;
}

function filterMenuItem(item: Navigation, permissionSet: Set<string>): Navigation | null {
  const copy: Navigation = { ...item, hidden: false, disabled: false };

  if (copy.children?.length) {
    copy.children = copy.children
      .map((child) => filterMenuItem(child, permissionSet))
      .filter((child): child is Navigation => child !== null);
  }

  if (copy.type === 'group' || copy.type === 'collapse') {
    if (!menuItemHasAccess(copy, permissionSet)) {
      return null;
    }
    if (!copy.children?.length) {
      return null;
    }
    return copy;
  }

  if (copy.type === 'item') {
    return menuItemHasAccess(copy, permissionSet) ? copy : null;
  }

  return null;
}

/**
 * Removes menu entries the user cannot access (instead of disabling them).
 * Module groups are hidden when the user has no permission in that module
 * or when all nested items are filtered out.
 */
export function filterMenuByPermissions(
  menuItems: Navigation[],
  userPermissions: unknown,
  isAdmin = false
): Navigation[] {
  if (isAdmin) {
    return menuItems;
  }

  const permissionSet = normalizePermissions(userPermissions);

  return menuItems
    .map((item) => filterMenuItem(item, permissionSet))
    .filter((item): item is Navigation => item !== null);
}

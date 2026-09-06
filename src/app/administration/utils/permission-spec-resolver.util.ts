import {
  PermissionSpecEntity,
  PermissionSpecRoleMirror,
  PermissionSpecRolePreset,
  PermissionSpecViewModel,
  ResolvedPermissionEntity
} from '../models/permission-catalog.model';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function normalizeEntity(raw: Record<string, unknown>): PermissionSpecEntity {
  return {
    module: String(raw['module'] ?? '').trim(),
    description: typeof raw['description'] === 'string' ? raw['description'] : undefined,
    section: typeof raw['section'] === 'string' ? raw['section'] : undefined,
    profile: typeof raw['profile'] === 'string' ? raw['profile'] : undefined,
    permissions: asStringArray(raw['permissions']),
    addActions: asStringArray(raw['addActions']),
    removeActions: asStringArray(raw['removeActions']),
    legacyAliases: asStringArray(raw['legacyAliases'])
  };
}

/** Mirrors PermissionCatalogLoader.resolveActions (profile | permissions → add → remove → unique sorted). */
export function resolveEntityActions(
  profiles: Record<string, string[]>,
  entitySpec: PermissionSpecEntity
): { actions: string[]; error?: string } {
  let actions: string[];

  if (entitySpec.permissions?.length) {
    actions = [...entitySpec.permissions];
  } else if (entitySpec.profile) {
    const profileActions = profiles[entitySpec.profile];
    if (!profileActions?.length) {
      return { actions: [], error: `Unknown permission profile: ${entitySpec.profile}` };
    }
    actions = [...profileActions];
  } else {
    return { actions: [], error: 'Entity must define profile or permissions' };
  }

  if (entitySpec.addActions?.length) {
    actions.push(...entitySpec.addActions);
  }

  if (entitySpec.removeActions?.length) {
    const remove = new Set(entitySpec.removeActions.map((a) => a.toUpperCase()));
    actions = actions.filter((a) => !remove.has(a.toUpperCase()));
  }

  const normalized = new Set<string>();
  for (const action of actions) {
    if (action?.trim()) {
      normalized.add(action.trim().toUpperCase());
    }
  }

  return { actions: [...normalized].sort((a, b) => a.localeCompare(b)) };
}

export function parsePermissionSpecDocument(raw: unknown, fileName: string): PermissionSpecViewModel {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid JSON: expected a permissions-spec object');
  }

  const root = raw as Record<string, unknown>;
  const warnings: string[] = [];

  const profilesRaw = (firstDefined(
    root['actionProfiles'],
    root['actionProfiles'],
    root['action_profiles']
  ) as Record<string, unknown> | undefined) ?? {};

  const actionProfiles: Record<string, string[]> = {};
  for (const [name, actions] of Object.entries(profilesRaw)) {
    actionProfiles[name] = asStringArray(actions);
  }

  if (!Object.keys(actionProfiles).length) {
    warnings.push('No actionProfiles found in the uploaded file.');
  }

  const entitiesRaw = (root['entities'] as Record<string, unknown> | undefined) ?? {};
  if (!Object.keys(entitiesRaw).length) {
    throw new Error('Invalid permissions-spec: missing entities map');
  }

  const entities: ResolvedPermissionEntity[] = [];
  for (const [entityName, value] of Object.entries(entitiesRaw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      warnings.push(`Skipped entity "${entityName}": invalid object`);
      continue;
    }
    const entitySpec = normalizeEntity(value as Record<string, unknown>);
    const resolved = resolveEntityActions(actionProfiles, entitySpec);
    entities.push({
      entity: entityName,
      module: entitySpec.module || 'UNKNOWN',
      description: entitySpec.description,
      section: entitySpec.section,
      profile: entitySpec.profile,
      explicitPermissions: entitySpec.permissions?.length ? entitySpec.permissions : undefined,
      addActions: entitySpec.addActions ?? [],
      removeActions: entitySpec.removeActions ?? [],
      legacyAliases: entitySpec.legacyAliases ?? [],
      resolvedActions: resolved.actions,
      resolveError: resolved.error
    });
  }

  entities.sort((a, b) => {
    const moduleCmp = a.module.localeCompare(b.module);
    return moduleCmp !== 0 ? moduleCmp : a.entity.localeCompare(b.entity);
  });

  const modulesRaw = (root['modules'] as Record<string, { description?: string }> | undefined) ?? {};
  const moduleCounts = new Map<string, number>();
  for (const entity of entities) {
    moduleCounts.set(entity.module, (moduleCounts.get(entity.module) ?? 0) + 1);
  }

  const modules = [...new Set([...Object.keys(modulesRaw), ...moduleCounts.keys()])]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      description: modulesRaw[name]?.description,
      entityCount: moduleCounts.get(name) ?? 0
    }));

  const roleMirrors = Array.isArray(root['roleMirrors'])
    ? (root['roleMirrors'] as PermissionSpecRoleMirror[])
    : [];
  const rolePresets = Array.isArray(root['rolePresets'])
    ? (root['rolePresets'] as PermissionSpecRolePreset[])
    : [];

  const profiles = Object.entries(actionProfiles)
    .map(([name, actions]) => ({ name, actions: [...actions] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const expectedPermissionCount = entities.reduce(
    (sum, entity) => sum + (entity.resolveError ? 0 : entity.resolvedActions.length),
    0
  );

  return {
    fileName,
    version: Number(root['version'] ?? 0),
    profileCount: profiles.length,
    entityCount: entities.length,
    expectedPermissionCount,
    moduleCount: modules.length,
    mirrorCount: roleMirrors.length,
    presetCount: rolePresets.length,
    actionCatalogCount: asStringArray(root['actions']).length,
    profiles,
    modules,
    entities,
    roleMirrors,
    rolePresets,
    parseWarnings: warnings
  };
}

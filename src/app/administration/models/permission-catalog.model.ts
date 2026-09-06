export interface PermissionCatalogStatus {
  specVersion: number;
  specEntityCount: number;
  specProfileCount: number;
  expectedPermissionCount: number;
  dbActivePermissionCount: number;
  syncOnStartup: boolean;
  specSource: string;
}

export interface PermissionCatalogSyncResponse {
  success: boolean;
  message: string;
  created?: number;
  existing?: number;
  legacyMerged?: number;
  mirrorGrants?: number;
  status?: PermissionCatalogStatus;
}

/** Client-side view of permissions-spec.json (upload preview). */
export interface PermissionSpecModuleMeta {
  value?: number;
  description?: string;
}

export interface PermissionSpecEntity {
  module: string;
  description?: string;
  section?: string;
  profile?: string;
  permissions?: string[];
  addActions?: string[];
  removeActions?: string[];
  legacyAliases?: string[];
}

export interface PermissionSpecRoleMirror {
  sourceModule: string;
  sourceEntity: string;
  targetModule: string;
  targetEntity: string;
}

export interface PermissionSpecRolePresetGrant {
  module: string;
  entity: string;
  actions: string[];
}

export interface PermissionSpecRolePreset {
  name: string;
  description?: string;
  grants: PermissionSpecRolePresetGrant[];
}

export interface PermissionSpecDocument {
  version: number;
  actionProfiles: Record<string, string[]>;
  modules?: Record<string, PermissionSpecModuleMeta>;
  actions?: string[];
  entities: Record<string, PermissionSpecEntity>;
  roleMirrors?: PermissionSpecRoleMirror[];
  rolePresets?: PermissionSpecRolePreset[];
}

export interface ResolvedPermissionEntity {
  entity: string;
  module: string;
  description?: string;
  section?: string;
  profile?: string;
  explicitPermissions?: string[];
  addActions: string[];
  removeActions: string[];
  legacyAliases: string[];
  resolvedActions: string[];
  resolveError?: string;
}

export interface PermissionSpecViewModel {
  fileName: string;
  version: number;
  profileCount: number;
  entityCount: number;
  expectedPermissionCount: number;
  moduleCount: number;
  mirrorCount: number;
  presetCount: number;
  actionCatalogCount: number;
  profiles: { name: string; actions: string[] }[];
  modules: { name: string; description?: string; entityCount: number }[];
  entities: ResolvedPermissionEntity[];
  roleMirrors: PermissionSpecRoleMirror[];
  rolePresets: PermissionSpecRolePreset[];
  /** Warnings emitted while parsing the uploaded/live JSON. */
  parseWarnings: string[];
}

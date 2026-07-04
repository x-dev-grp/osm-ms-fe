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

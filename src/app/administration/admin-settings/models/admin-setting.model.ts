export type SettingSource = 'DATABASE' | 'ENV' | 'DEFAULT';

export interface AdminSetting {
  key: string;
  value: string | null;
  configured: boolean;
  sensitive: boolean;
  restartRequired: boolean;
  reloadable: boolean;
  editable: boolean;
  valueType: string;
  source: SettingSource;
  label: string;
  description?: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

export interface AdminSettingCategory {
  key: string;
  label: string;
  settings: AdminSetting[];
}

export interface AdminSettingsListResponse {
  categories: AdminSettingCategory[];
}

export interface FeatureStatus {
  enabled: boolean;
  configured: boolean;
  provider?: string;
  missingKeys: string[];
}

export interface AdminSettingsStatus {
  settingsVersion: number;
  lastReloadAt?: string;
  sourceCounts: Record<string, number>;
  features: Record<string, FeatureStatus>;
  missingFeatureRequired: string[];
}

export interface AdminSettingAuditEntry {
  settingKey: string;
  action: string;
  oldValueMasked?: string;
  newValueMasked?: string;
  changedByUsername?: string;
  changedAt: string;
  reason?: string;
  success: boolean;
  failureReason?: string;
}

export interface MailTestResponse {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

export interface UpdateSettingRequest {
  value: string;
  reason?: string;
  confirmRestart?: boolean;
}

export interface RotateSecretRequest {
  value: string;
  reason?: string;
}

export interface MailTestRequest {
  to: string;
}

export interface PagedAuditResponse {
  content: AdminSettingAuditEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

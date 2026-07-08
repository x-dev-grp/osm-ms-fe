import { OOSMModule } from 'src/app/theme/types/permissions';

export interface TenantModuleOption {
  value: OOSMModule;
  labelKey: string;
}

export const TENANT_MODULE_OPTIONS: TenantModuleOption[] = [
  { value: OOSMModule.HR, labelKey: 'TENANT_MODULES.HR' },
  { value: OOSMModule.RECEPTION, labelKey: 'TENANT_MODULES.RECEPTION' },
  { value: OOSMModule.PRODUCTION, labelKey: 'TENANT_MODULES.PRODUCTION' },
  { value: OOSMModule.FINANCE, labelKey: 'TENANT_MODULES.FINANCE' },
  { value: OOSMModule.INVENTAIR, labelKey: 'TENANT_MODULES.INVENTAIR' },
  { value: OOSMModule.CONDITIONING, labelKey: 'TENANT_MODULES.CONDITIONING' },
  { value: OOSMModule.HABILITATION, labelKey: 'TENANT_MODULES.HABILITATION' }
];

export const ALL_TENANT_MODULE_VALUES = TENANT_MODULE_OPTIONS.map((option) => option.value);

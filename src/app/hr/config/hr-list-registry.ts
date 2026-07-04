import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HREntity } from '../../theme/types/permissions';
import { CONTRACT_DASHBOARD_CONFIG } from './contract-dashboard.config';
import { EMPLOYEE_DASHBOARD_CONFIG } from './employee-dashboard.config';
import { LEAVE_REQUEST_DASHBOARD_CONFIG } from './leave-request-dashboard.config';
import { PAYROLL_PERIOD_DASHBOARD_CONFIG } from './payroll-period-dashboard.config';
import { PAYSLIP_DASHBOARD_CONFIG } from './payslip-dashboard.config';
import { POINTAGE_DASHBOARD_CONFIG } from './pointage-dashboard.config';
import { POSTE_DASHBOARD_CONFIG } from './poste-dashboard.config';

export interface HrListMeta {
  dashboardConfig: DashboardConfig;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  basePath: string;
  entity: HREntity;
  themeKey: string;
}

export const HR_LIST_REGISTRY: Record<string, HrListMeta> = {
  employees: {
    dashboardConfig: EMPLOYEE_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.EMPLOYEES.TITLE',
    subtitleKey: 'HR.PAGE.EMPLOYEES.SUBTITLE',
    icon: 'groups',
    basePath: '/hr/employees',
    entity: HREntity.EMPLOYEE,
    themeKey: 'employees'
  },
  postes: {
    dashboardConfig: POSTE_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.POSITIONS.TITLE',
    subtitleKey: 'HR.PAGE.POSITIONS.SUBTITLE',
    icon: 'badge',
    basePath: '/hr/postes',
    entity: HREntity.POSTE,
    themeKey: 'postes'
  },
  contracts: {
    dashboardConfig: CONTRACT_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.CONTRACTS.TITLE',
    subtitleKey: 'HR.PAGE.CONTRACTS.SUBTITLE',
    icon: 'description',
    basePath: '/hr/contracts',
    entity: HREntity.CONTRACT,
    themeKey: 'contracts'
  },
  pointages: {
    dashboardConfig: POINTAGE_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.POINTAGE.TITLE',
    subtitleKey: 'HR.PAGE.POINTAGE.SUBTITLE',
    icon: 'schedule',
    basePath: '/hr/pointages',
    entity: HREntity.POINTAGE,
    themeKey: 'pointages'
  },
  'leave-requests': {
    dashboardConfig: LEAVE_REQUEST_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.LEAVE.TITLE',
    subtitleKey: 'HR.PAGE.LEAVE.SUBTITLE',
    icon: 'event_busy',
    basePath: '/hr/leave-requests',
    entity: HREntity.LEAVEREQUEST,
    themeKey: 'leave'
  },
  'payroll-periods': {
    dashboardConfig: PAYROLL_PERIOD_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.PAYROLL.TITLE',
    subtitleKey: 'HR.PAGE.PAYROLL.SUBTITLE',
    icon: 'calendar_month',
    basePath: '/hr/payroll-periods',
    entity: HREntity.PAYROLLPERIOD,
    themeKey: 'payroll'
  },
  payslips: {
    dashboardConfig: PAYSLIP_DASHBOARD_CONFIG,
    titleKey: 'HR.PAYSLIPS.LIST_TITLE',
    subtitleKey: 'HR.PAGE.PAYROLL_FORM.SUBTITLE',
    icon: 'receipt_long',
    basePath: '/hr/payslips',
    entity: HREntity.PAYSLIP,
    themeKey: 'payslips'
  }
};

export function resolveHrListMeta(path: string): HrListMeta | undefined {
  return HR_LIST_REGISTRY[path];
}

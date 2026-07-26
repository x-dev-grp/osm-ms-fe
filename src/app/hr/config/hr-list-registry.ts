import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HREntity } from '../../theme/types/permissions';
import { CONTRACT_DASHBOARD_CONFIG } from './contract-dashboard.config';
import { DEPARTMENTS_DASHBOARD_CONFIG } from './departments-dashboard.config';
import { EMPLOYEE_DASHBOARD_CONFIG } from './employee-dashboard.config';
import { EMPLOYEE_DOCUMENTS_DASHBOARD_CONFIG } from './employee-documents-dashboard.config';
import { EMPLOYEE_LOANS_DASHBOARD_CONFIG } from './employee-loans-dashboard.config';
import { GRADES_DASHBOARD_CONFIG } from './grades-dashboard.config';
import { LEAVE_REQUEST_DASHBOARD_CONFIG } from './leave-request-dashboard.config';
import { LEAVE_TYPES_DASHBOARD_CONFIG } from './leave-types-dashboard.config';
import { LEGAL_RULES_DASHBOARD_CONFIG } from './legal-rules-dashboard.config';
import { MINIMUM_WAGE_RULES_DASHBOARD_CONFIG } from './minimum-wage-rules-dashboard.config';
import { OVERTIME_REQUESTS_DASHBOARD_CONFIG } from './overtime-requests-dashboard.config';
import { PAYROLL_PERIOD_DASHBOARD_CONFIG } from './payroll-period-dashboard.config';
import { PAYROLL_VARIABLES_DASHBOARD_CONFIG } from './payroll-variables-dashboard.config';
import { PAYSLIP_DASHBOARD_CONFIG } from './payslip-dashboard.config';
import { POINTAGE_DASHBOARD_CONFIG } from './pointage-dashboard.config';
import { POSTE_DASHBOARD_CONFIG } from './poste-dashboard.config';
import { PUBLIC_HOLIDAYS_DASHBOARD_CONFIG } from './public-holidays-dashboard.config';
import { SALARY_ADVANCES_DASHBOARD_CONFIG } from './salary-advances-dashboard.config';
import { SALARY_COMPONENTS_DASHBOARD_CONFIG } from './salary-components-dashboard.config';
import { SOCIAL_SECURITY_CONFIGS_DASHBOARD_CONFIG } from './social-security-configs-dashboard.config';
import { TAX_CONFIGURATIONS_DASHBOARD_CONFIG } from './tax-configurations-dashboard.config';
import { TIMESHEETS_DASHBOARD_CONFIG } from './timesheets-dashboard.config';
import { WORK_SCHEDULES_DASHBOARD_CONFIG } from './work-schedules-dashboard.config';

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
  },
  departments: {
    dashboardConfig: DEPARTMENTS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.DEPARTMENTS.TITLE',
    subtitleKey: 'HR.PAGE.DEPARTMENTS.SUBTITLE',
    icon: 'account_tree',
    basePath: '/hr/departments',
    entity: HREntity.DEPARTMENT,
    themeKey: 'departments'
  },
  grades: {
    dashboardConfig: GRADES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.GRADES.TITLE',
    subtitleKey: 'HR.PAGE.GRADES.SUBTITLE',
    icon: 'military_tech',
    basePath: '/hr/grades',
    entity: HREntity.GRADE,
    themeKey: 'grades'
  },
  'work-schedules': {
    dashboardConfig: WORK_SCHEDULES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.WORK_SCHEDULES.TITLE',
    subtitleKey: 'HR.PAGE.WORK_SCHEDULES.SUBTITLE',
    icon: 'event_repeat',
    basePath: '/hr/work-schedules',
    entity: HREntity.WORKSCHEDULE,
    themeKey: 'schedules'
  },
  timesheets: {
    dashboardConfig: TIMESHEETS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.TIMESHEETS.TITLE',
    subtitleKey: 'HR.PAGE.TIMESHEETS.SUBTITLE',
    icon: 'pending_actions',
    basePath: '/hr/timesheets',
    entity: HREntity.TIMESHEET,
    themeKey: 'timesheets'
  },
  'overtime-requests': {
    dashboardConfig: OVERTIME_REQUESTS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.OVERTIME_REQUESTS.TITLE',
    subtitleKey: 'HR.PAGE.OVERTIME_REQUESTS.SUBTITLE',
    icon: 'more_time',
    basePath: '/hr/overtime-requests',
    entity: HREntity.OVERTIMEREQUEST,
    themeKey: 'overtime'
  },
  'leave-types': {
    dashboardConfig: LEAVE_TYPES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.LEAVE_TYPES.TITLE',
    subtitleKey: 'HR.PAGE.LEAVE_TYPES.SUBTITLE',
    icon: 'category',
    basePath: '/hr/leave-types',
    entity: HREntity.LEAVETYPE,
    themeKey: 'leave-types'
  },
  'public-holidays': {
    dashboardConfig: PUBLIC_HOLIDAYS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.PUBLIC_HOLIDAYS.TITLE',
    subtitleKey: 'HR.PAGE.PUBLIC_HOLIDAYS.SUBTITLE',
    icon: 'celebration',
    basePath: '/hr/public-holidays',
    entity: HREntity.PUBLICHOLIDAY,
    themeKey: 'holidays'
  },
  'salary-advances': {
    dashboardConfig: SALARY_ADVANCES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.SALARY_ADVANCES.TITLE',
    subtitleKey: 'HR.PAGE.SALARY_ADVANCES.SUBTITLE',
    icon: 'payments',
    basePath: '/hr/salary-advances',
    entity: HREntity.SALARYADVANCE,
    themeKey: 'advances'
  },
  'employee-loans': {
    dashboardConfig: EMPLOYEE_LOANS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.EMPLOYEE_LOANS.TITLE',
    subtitleKey: 'HR.PAGE.EMPLOYEE_LOANS.SUBTITLE',
    icon: 'account_balance',
    basePath: '/hr/employee-loans',
    entity: HREntity.EMPLOYEELOAN,
    themeKey: 'loans'
  },
  'salary-components': {
    dashboardConfig: SALARY_COMPONENTS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.SALARY_COMPONENTS.TITLE',
    subtitleKey: 'HR.PAGE.SALARY_COMPONENTS.SUBTITLE',
    icon: 'toll',
    basePath: '/hr/salary-components',
    entity: HREntity.SALARYCOMPONENT,
    themeKey: 'components'
  },
  'legal-rules': {
    dashboardConfig: LEGAL_RULES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.LEGAL_RULES.TITLE',
    subtitleKey: 'HR.PAGE.LEGAL_RULES.SUBTITLE',
    icon: 'gavel',
    basePath: '/hr/legal-rules',
    entity: HREntity.LEGALRULE,
    themeKey: 'legal'
  },
  'social-security-configs': {
    dashboardConfig: SOCIAL_SECURITY_CONFIGS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.SOCIAL_SECURITY.TITLE',
    subtitleKey: 'HR.PAGE.SOCIAL_SECURITY.SUBTITLE',
    icon: 'health_and_safety',
    basePath: '/hr/social-security-configs',
    entity: HREntity.SOCIALSECURITYCONFIG,
    themeKey: 'cnss'
  },
  'tax-configurations': {
    dashboardConfig: TAX_CONFIGURATIONS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.TAX_CONFIG.TITLE',
    subtitleKey: 'HR.PAGE.TAX_CONFIG.SUBTITLE',
    icon: 'receipt',
    basePath: '/hr/tax-configurations',
    entity: HREntity.TAXCONFIGURATION,
    themeKey: 'tax'
  },
  'minimum-wage-rules': {
    dashboardConfig: MINIMUM_WAGE_RULES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.MINIMUM_WAGE.TITLE',
    subtitleKey: 'HR.PAGE.MINIMUM_WAGE.SUBTITLE',
    icon: 'trending_up',
    basePath: '/hr/minimum-wage-rules',
    entity: HREntity.MINIMUMWAGERULE,
    themeKey: 'smig'
  },
  'employee-documents': {
    dashboardConfig: EMPLOYEE_DOCUMENTS_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.EMPLOYEE_DOCUMENTS.TITLE',
    subtitleKey: 'HR.PAGE.EMPLOYEE_DOCUMENTS.SUBTITLE',
    icon: 'folder_shared',
    basePath: '/hr/employee-documents',
    entity: HREntity.EMPLOYEEDOCUMENT,
    themeKey: 'documents'
  },
  'payroll-variables': {
    dashboardConfig: PAYROLL_VARIABLES_DASHBOARD_CONFIG,
    titleKey: 'HR.PAGE.PAYROLL_VARIABLES.TITLE',
    subtitleKey: 'HR.PAGE.PAYROLL_VARIABLES.SUBTITLE',
    icon: 'tune',
    basePath: '/hr/payroll-variables',
    entity: HREntity.PAYROLLVARIABLE,
    themeKey: 'variables'
  }
};

export function resolveHrListMeta(path: string): HrListMeta | undefined {
  return HR_LIST_REGISTRY[path];
}

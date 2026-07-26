import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
import { allPermissionGuard } from '../interceptors/guards/permission.guard';
import { Action, HREntity, OOSMModule, permissionKey } from '../theme/types/permissions';
import { HrEntityListComponent } from './shared/hr-entity-list.component';

const listRoutes: Array<{ path: string; entity: HREntity }> = [
  { path: 'employees', entity: HREntity.EMPLOYEE },
  { path: 'postes', entity: HREntity.POSTE },
  { path: 'contracts', entity: HREntity.CONTRACT },
  { path: 'pointages', entity: HREntity.POINTAGE },
  { path: 'leave-requests', entity: HREntity.LEAVEREQUEST },
  { path: 'payroll-periods', entity: HREntity.PAYROLLPERIOD },
  { path: 'payslips', entity: HREntity.PAYSLIP },
  { path: 'departments', entity: HREntity.DEPARTMENT },
  { path: 'grades', entity: HREntity.GRADE },
  { path: 'work-schedules', entity: HREntity.WORKSCHEDULE },
  { path: 'timesheets', entity: HREntity.TIMESHEET },
  { path: 'overtime-requests', entity: HREntity.OVERTIMEREQUEST },
  { path: 'leave-types', entity: HREntity.LEAVETYPE },
  { path: 'public-holidays', entity: HREntity.PUBLICHOLIDAY },
  { path: 'salary-advances', entity: HREntity.SALARYADVANCE },
  { path: 'employee-loans', entity: HREntity.EMPLOYEELOAN },
  { path: 'salary-components', entity: HREntity.SALARYCOMPONENT },
  { path: 'legal-rules', entity: HREntity.LEGALRULE },
  { path: 'social-security-configs', entity: HREntity.SOCIALSECURITYCONFIG },
  { path: 'tax-configurations', entity: HREntity.TAXCONFIGURATION },
  { path: 'minimum-wage-rules', entity: HREntity.MINIMUMWAGERULE },
  { path: 'employee-documents', entity: HREntity.EMPLOYEEDOCUMENT },
  { path: 'payroll-variables', entity: HREntity.PAYROLLVARIABLE }
];

const formRoutes: Array<{
  path: string;
  entity: HREntity;
  load: () => Promise<unknown>;
  exportName: string;
}> = [
  {
    path: 'employees',
    entity: HREntity.EMPLOYEE,
    load: () => import('./employees/employee-form.component'),
    exportName: 'EmployeeFormComponent'
  },
  {
    path: 'postes',
    entity: HREntity.POSTE,
    load: () => import('./postes/poste-form.component'),
    exportName: 'PosteFormComponent'
  },
  {
    path: 'contracts',
    entity: HREntity.CONTRACT,
    load: () => import('./contracts/contract-form.component'),
    exportName: 'ContractFormComponent'
  },
  {
    path: 'pointages',
    entity: HREntity.POINTAGE,
    load: () => import('./pointages/pointage-form.component'),
    exportName: 'PointageFormComponent'
  },
  {
    path: 'leave-requests',
    entity: HREntity.LEAVEREQUEST,
    load: () => import('./leave-requests/leave-request-form.component'),
    exportName: 'LeaveRequestFormComponent'
  },
  {
    path: 'payroll-periods',
    entity: HREntity.PAYROLLPERIOD,
    load: () => import('./payroll-periods/payroll-period-form.component'),
    exportName: 'PayrollPeriodFormComponent'
  },
  {
    path: 'payslips',
    entity: HREntity.PAYSLIP,
    load: () => import('./payslips/payslip-form.component'),
    exportName: 'PayslipFormComponent'
  },
  {
    path: 'departments',
    entity: HREntity.DEPARTMENT,
    load: () => import('./departments/department-form.component'),
    exportName: 'DepartmentFormComponent'
  },
  {
    path: 'grades',
    entity: HREntity.GRADE,
    load: () => import('./grades/grade-form.component'),
    exportName: 'GradeFormComponent'
  },
  {
    path: 'work-schedules',
    entity: HREntity.WORKSCHEDULE,
    load: () => import('./work-schedules/work-schedule-form.component'),
    exportName: 'WorkScheduleFormComponent'
  },
  {
    path: 'timesheets',
    entity: HREntity.TIMESHEET,
    load: () => import('./timesheets/timesheet-form.component'),
    exportName: 'TimesheetFormComponent'
  },
  {
    path: 'overtime-requests',
    entity: HREntity.OVERTIMEREQUEST,
    load: () => import('./overtime-requests/overtime-request-form.component'),
    exportName: 'OvertimeRequestFormComponent'
  },
  {
    path: 'leave-types',
    entity: HREntity.LEAVETYPE,
    load: () => import('./leave-types/leave-type-form.component'),
    exportName: 'LeaveTypeFormComponent'
  },
  {
    path: 'public-holidays',
    entity: HREntity.PUBLICHOLIDAY,
    load: () => import('./public-holidays/public-holiday-form.component'),
    exportName: 'PublicHolidayFormComponent'
  },
  {
    path: 'salary-advances',
    entity: HREntity.SALARYADVANCE,
    load: () => import('./salary-advances/salary-advance-form.component'),
    exportName: 'SalaryAdvanceFormComponent'
  },
  {
    path: 'employee-loans',
    entity: HREntity.EMPLOYEELOAN,
    load: () => import('./employee-loans/employee-loan-form.component'),
    exportName: 'EmployeeLoanFormComponent'
  },
  {
    path: 'salary-components',
    entity: HREntity.SALARYCOMPONENT,
    load: () => import('./salary-components/salary-component-form.component'),
    exportName: 'SalaryComponentFormComponent'
  },
  {
    path: 'legal-rules',
    entity: HREntity.LEGALRULE,
    load: () => import('./legal-rules/legal-rule-form.component'),
    exportName: 'LegalRuleFormComponent'
  },
  {
    path: 'social-security-configs',
    entity: HREntity.SOCIALSECURITYCONFIG,
    load: () => import('./social-security-configs/social-security-config-form.component'),
    exportName: 'SocialSecurityConfigFormComponent'
  },
  {
    path: 'tax-configurations',
    entity: HREntity.TAXCONFIGURATION,
    load: () => import('./tax-configurations/tax-configuration-form.component'),
    exportName: 'TaxConfigurationFormComponent'
  },
  {
    path: 'minimum-wage-rules',
    entity: HREntity.MINIMUMWAGERULE,
    load: () => import('./minimum-wage-rules/minimum-wage-rule-form.component'),
    exportName: 'MinimumWageRuleFormComponent'
  },
  {
    path: 'employee-documents',
    entity: HREntity.EMPLOYEEDOCUMENT,
    load: () => import('./employee-documents/employee-document-form.component'),
    exportName: 'EmployeeDocumentFormComponent'
  },
  {
    path: 'payroll-variables',
    entity: HREntity.PAYROLLVARIABLE,
    load: () => import('./payroll-variables/payroll-variable-form.component'),
    exportName: 'PayrollVariableFormComponent'
  }
];

function formLoadComponent(load: () => Promise<Record<string, unknown>>, exportName: string) {
  return () => load().then((m) => m[exportName] as never);
}

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./hr-dashboard/hr-dashboard.component').then((m) => m.HrDashboardComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/hr-settings.component').then((m) => m.HrSettingsComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.LEGALRULE, Action.READ)])]
  },
  {
    path: 'company-legal-profile',
    loadComponent: () =>
      import('./company-legal-profile/company-legal-profile-form.component').then((m) => m.CompanyLegalProfileFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.COMPANYLEGALPROFILE, Action.READ)])]
  },
  {
    path: 'compliance',
    loadComponent: () => import('./compliance/hr-compliance.component').then((m) => m.HrComplianceComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.COMPLIANCE, Action.READ)])]
  },
  {
    path: 'agent',
    loadComponent: () => import('./agent/hr-agent.component').then((m) => m.HrAgentComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
  },
  ...listRoutes.map(({ path, entity }) => ({
    path,
    component: HrEntityListComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, entity, Action.READ)])]
  })),
  ...formRoutes.flatMap(({ path, entity, load, exportName }) => [
    {
      path: `${path}/new`,
      loadComponent: formLoadComponent(load as () => Promise<Record<string, unknown>>, exportName),
      canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, entity, Action.CREATE)])]
    },
    {
      path: `${path}/:id/edit`,
      loadComponent: formLoadComponent(load as () => Promise<Record<string, unknown>>, exportName),
      canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, entity, Action.UPDATE)])]
    },
    {
      path: `${path}/:id/view`,
      loadComponent: formLoadComponent(load as () => Promise<Record<string, unknown>>, exportName),
      canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, entity, Action.READ)])]
    }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
import { allPermissionGuard } from '../interceptors/guards/permission.guard';
import { Action, HREntity, OOSMModule, permissionKey } from '../theme/types/permissions';
import { HrEntityListComponent } from './shared/hr-entity-list.component';

const listRoutes: Array<{ path: string; entity: HREntity; read: boolean }> = [
  { path: 'employees', entity: HREntity.EMPLOYEE, read: true },
  { path: 'postes', entity: HREntity.POSTE, read: true },
  { path: 'contracts', entity: HREntity.CONTRACT, read: true },
  { path: 'pointages', entity: HREntity.POINTAGE, read: true },
  { path: 'leave-requests', entity: HREntity.LEAVEREQUEST, read: true },
  { path: 'payroll-periods', entity: HREntity.PAYROLLPERIOD, read: true },
  { path: 'payslips', entity: HREntity.PAYSLIP, read: true }
];

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./hr-dashboard/hr-dashboard.component').then((m) => m.HrDashboardComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
  },
  ...listRoutes.map(({ path, entity }) => ({
    path,
    component: HrEntityListComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, entity, Action.READ)])]
  })),
  {
    path: 'employees/new',
    loadComponent: () => import('./employees/employee-form.component').then((m) => m.EmployeeFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.CREATE)])]
  },
  {
    path: 'employees/:id/edit',
    loadComponent: () => import('./employees/employee-form.component').then((m) => m.EmployeeFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.UPDATE)])]
  },
  {
    path: 'employees/:id/view',
    loadComponent: () => import('./employees/employee-form.component').then((m) => m.EmployeeFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
  },
  {
    path: 'postes/new',
    loadComponent: () => import('./postes/poste-form.component').then((m) => m.PosteFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POSTE, Action.CREATE)])]
  },
  {
    path: 'postes/:id/edit',
    loadComponent: () => import('./postes/poste-form.component').then((m) => m.PosteFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POSTE, Action.UPDATE)])]
  },
  {
    path: 'postes/:id/view',
    loadComponent: () => import('./postes/poste-form.component').then((m) => m.PosteFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POSTE, Action.READ)])]
  },
  {
    path: 'contracts/new',
    loadComponent: () => import('./contracts/contract-form.component').then((m) => m.ContractFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.CONTRACT, Action.CREATE)])]
  },
  {
    path: 'contracts/:id/edit',
    loadComponent: () => import('./contracts/contract-form.component').then((m) => m.ContractFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.CONTRACT, Action.UPDATE)])]
  },
  {
    path: 'contracts/:id/view',
    loadComponent: () => import('./contracts/contract-form.component').then((m) => m.ContractFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.CONTRACT, Action.READ)])]
  },
  {
    path: 'pointages/new',
    loadComponent: () => import('./pointages/pointage-form.component').then((m) => m.PointageFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POINTAGE, Action.CREATE)])]
  },
  {
    path: 'pointages/:id/edit',
    loadComponent: () => import('./pointages/pointage-form.component').then((m) => m.PointageFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POINTAGE, Action.UPDATE)])]
  },
  {
    path: 'pointages/:id/view',
    loadComponent: () => import('./pointages/pointage-form.component').then((m) => m.PointageFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.POINTAGE, Action.READ)])]
  },
  {
    path: 'leave-requests/new',
    loadComponent: () => import('./leave-requests/leave-request-form.component').then((m) => m.LeaveRequestFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.CREATE)])]
  },
  {
    path: 'leave-requests/:id/edit',
    loadComponent: () => import('./leave-requests/leave-request-form.component').then((m) => m.LeaveRequestFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.UPDATE)])]
  },
  {
    path: 'leave-requests/:id/view',
    loadComponent: () => import('./leave-requests/leave-request-form.component').then((m) => m.LeaveRequestFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.LEAVEREQUEST, Action.READ)])]
  },
  {
    path: 'payroll-periods/new',
    loadComponent: () => import('./payroll-periods/payroll-period-form.component').then((m) => m.PayrollPeriodFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.CREATE)])]
  },
  {
    path: 'payroll-periods/:id/edit',
    loadComponent: () => import('./payroll-periods/payroll-period-form.component').then((m) => m.PayrollPeriodFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.UPDATE)])]
  },
  {
    path: 'payroll-periods/:id/view',
    loadComponent: () => import('./payroll-periods/payroll-period-form.component').then((m) => m.PayrollPeriodFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.READ)])]
  },
  {
    path: 'payslips/new',
    loadComponent: () => import('./payslips/payslip-form.component').then((m) => m.PayslipFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYSLIP, Action.CREATE)])]
  },
  {
    path: 'payslips/:id/edit',
    loadComponent: () => import('./payslips/payslip-form.component').then((m) => m.PayslipFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYSLIP, Action.UPDATE)])]
  },
  {
    path: 'payslips/:id/view',
    loadComponent: () => import('./payslips/payslip-form.component').then((m) => m.PayslipFormComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.HR, HREntity.PAYSLIP, Action.READ)])]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {}

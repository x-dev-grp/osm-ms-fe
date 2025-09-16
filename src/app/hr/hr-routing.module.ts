import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
// CHANGE: permissions - import permission guards
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { OSMModule, HREntity, Action, permissionKey } from 'src/app/theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'employee',
        loadComponent: () => import('./components/employee/employee.component').then((m) => m.EmployeeComponent),
        // CHANGE: permissions - require HR:EMPLOYEE:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
      },
      {
        path: 'pointage',
        loadComponent: () => import('./components/employee/pointage/pointage.component').then((m) => m.PointageComponent),
        // CHANGE: permissions - require HR:POINTAGE:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.POINTAGE, Action.READ)])]
      },
      {
        path: 'department',
        loadComponent: () => import('./components/department/department.component').then((m) => m.DepartmentComponent),
        // CHANGE: permissions - require HR:DEPARTMENT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.DEPARTMENT, Action.READ)])]
      },
      {
        path: 'contract',
        loadComponent: () => import('./components/contrat/contrat.component').then((m) => m.ContratComponent),
        // CHANGE: permissions - require HR:CONTRACT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.CONTRACT, Action.READ)])]
      },
      {
        path: 'poste',
        loadComponent: () => import('./components/poste/poste.component').then((m) => m.PosteComponent
        ),
        // CHANGE: permissions - require HR:POSTE:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.POSTE, Action.READ)])]
      },

      {
        path: 'contract/employee/:employeeId',
        loadComponent: () => import('./components/contrat/contract-add/contract-add.component').then((m) => m.ContractAddComponent),
        // CHANGE: permissions - require HR:CONTRACT:CREATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.CONTRACT, Action.CREATE)])]
      },
      {
        path: 'contract/employee/:employeeId/:id',
        loadComponent: () => import('./components/contrat/contract-add/contract-add.component').then((m) => m.ContractAddComponent),
        // CHANGE: permissions - require HR:CONTRACT:UPDATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.CONTRACT, Action.UPDATE)])]
      },
      {
        path: 'department/new',
        loadComponent: () => import('./components/department/department-add/department-add.component').then((m) => m.DepartmentAddComponent),
        // CHANGE: permissions - require HR:DEPARTMENT:CREATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.DEPARTMENT, Action.CREATE)])]
      },
      {
        path: 'poste/new',
        loadComponent: () => import('./components/poste/poste-add/poste-add.component').then((m) => m.PosteAddComponent),
        // CHANGE: permissions - require HR:POSTE:CREATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.POSTE, Action.CREATE)])]
      },
      {
        path: 'poste/:id',
        loadComponent: () => import('./components/poste/poste-add/poste-add.component').then((m) => m.PosteAddComponent),
        // CHANGE: permissions - require HR:POSTE:UPDATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.POSTE, Action.UPDATE)])]
      },
      {
        path: 'department/:id',
        loadComponent: () => import('./components/department/department-add/department-add.component').then((m) => m.DepartmentAddComponent),
        // CHANGE: permissions - require HR:DEPARTMENT:UPDATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.DEPARTMENT, Action.UPDATE)])]
      },

      { path: 'department/fetch/:id',
        loadComponent: () => import('./components/department/department-detail/department-detail.component').then((m) => m.DepartmentDetailComponent),
        // CHANGE: permissions - require HR:DEPARTMENT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.DEPARTMENT, Action.READ)])]
      },
      {
        path: 'employee/new',
        loadComponent: () => import('./components/employee/employee-add/employee-add.component').then((m) => m.EmployeeAddComponent),
        // CHANGE: permissions - require HR:EMPLOYEE:CREATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.EMPLOYEE, Action.CREATE)])]
      },
      {
        path: 'employee/:id',
        loadComponent: () => import('./components/employee/employee-add/employee-add.component').then((m) => m.EmployeeAddComponent),
        // CHANGE: permissions - require HR:EMPLOYEE:UPDATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.EMPLOYEE, Action.UPDATE)])]
      },
      {
        path: 'employee/fetch/:id',
        loadComponent: () => import('./components/employee/employee-detail/employee-detail.component').then((m) => m.EmployeeDetailComponent),
        // CHANGE: permissions - require HR:EMPLOYEE:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HR, HREntity.EMPLOYEE, Action.READ)])]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {}

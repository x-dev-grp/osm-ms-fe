import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'employee',
        loadComponent: () => import('./components/employee/employee.component').then((m) => m.EmployeeComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'pointage',
        loadComponent: () => import('./components/pointage/pointage.component').then((m) => m.PointageComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'department',
        loadComponent: () => import('./components/department/department.component').then((m) => m.DepartmentComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'contract',
        loadComponent: () => import('./components/contrat/contrat.component').then((m) => m.ContratComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'poste',
        loadComponent: () => import('./components/poste/poste.component').then((m) => m.PosteComponent
        ),
        canActivate: [AuthGuardChild]
      },

      {
        path: 'contract/employee/:employeeId',
        loadComponent: () => import('./components/contract-add/contract-add.component').then((m) => m.ContractAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'contract/employee/:employeeId/:id',
        loadComponent: () => import('./components/contract-add/contract-add.component').then((m) => m.ContractAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'department/new',
        loadComponent: () => import('./components/department-add/department-add.component').then((m) => m.DepartmentAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'poste/new',
        loadComponent: () => import('./components/poste-add/poste-add.component').then((m) => m.PosteAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'poste/:id',
        loadComponent: () => import('./components/poste-add/poste-add.component').then((m) => m.PosteAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'department/:id',
        loadComponent: () => import('./components/department-add/department-add.component').then((m) => m.DepartmentAddComponent),
        canActivate: [AuthGuardChild]
      },

      { path: 'department/fetch/:id',
        loadComponent: () => import('./components/department-detail/department-detail.component').then((m) => m.DepartmentDetailComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'employee/new',
        loadComponent: () => import('./components/employee-add/employee-add.component').then((m) => m.EmployeeAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'employee/:id',
        loadComponent: () => import('./components/employee-add/employee-add.component').then((m) => m.EmployeeAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'employee/fetch/:id',
        loadComponent: () => import('./components/employee-detail/employee-detail.component').then((m) => m.EmployeeDetailComponent),
        canActivate: [AuthGuardChild]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {}

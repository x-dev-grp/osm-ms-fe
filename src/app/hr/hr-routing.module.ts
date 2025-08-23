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

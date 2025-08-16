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
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrRoutingModule {}

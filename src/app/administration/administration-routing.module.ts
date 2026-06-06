import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminAuthGuard } from '../interceptors/guards/admin-auth.guard';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./administration-dashboard/administration-dashboard.component').then(m => m.AdministrationDashboardComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'add-company-user',
    loadComponent: () => import('./add-company-user/add-company-user.component').then(m => m.AddCompanyUserComponent),
    canActivate: [AdminAuthGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { }

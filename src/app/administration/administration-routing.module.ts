import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./administration-dashboard/administration-dashboard.component').then(m => m.AdministrationDashboardComponent)
  },
  {
    path: 'add-company-user',
    loadComponent: () => import('./add-company-user/add-company-user.component').then(m => m.AddCompanyUserComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule {}

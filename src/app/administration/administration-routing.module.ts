import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminAuthGuard } from '../interceptors/guards/admin-auth.guard';

const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./administration-dashboard/administration-dashboard.component').then((m) => m.AdministrationDashboardComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'add-company-user',
    loadComponent: () => import('./add-company-user/add-company-user.component').then((m) => m.AddCompanyUserComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'osm-admins/add',
    loadComponent: () => import('./add-oosm-admin-user/add-oosm-admin-user.component').then((m) => m.AddOosmAdminUserComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'companies',
    loadComponent: () => import('./admin-companies/admin-companies.component').then((m) => m.AdminCompaniesComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'support',
    loadComponent: () => import('./admin-support/admin-support.component').then((m) => m.AdminSupportComponent),
    canActivate: [AdminAuthGuard]
  },
  {
    path: 'permission-catalog',
    loadComponent: () =>
      import('./admin-permission-catalog/admin-permission-catalog.component').then((m) => m.AdminPermissionCatalogComponent),
    canActivate: [AdminAuthGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule {}

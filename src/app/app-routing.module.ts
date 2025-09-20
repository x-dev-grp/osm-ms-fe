// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
import { AuthGuardChild } from './interceptors/guards/auth.guard';
// CHANGE: permissions - import permission guards and enums
import { allPermissionGuard, anyPermissionGuard } from './interceptors/guards/permission.guard';
import { OSMModule, ProductionEntity, ReceptionEntity, Action, permissionKey } from './theme/types/permissions';

//Type
import { Role } from './theme/types/role';
import { receptionRoutes } from './reception/reception.routes';
import { FinanceRoutingModule } from './finance/finance-routing.module';
import { SupplierDetailsComponent } from './reception/suppliers/supplier-details/supplier-details.component';
import { AdminComponent } from './theme/layouts/admin/admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [

      {
        path: '',
        redirectTo: '/reception',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadChildren: () => import('./theme/pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: { roles: [Role.Admin, Role.User] }
      },


      {
        path: 'access-denied',
        loadComponent: () =>
          import('./theme/layouts/access-denied/access-denied.component')
            .then(m => m.AccessDeniedComponent)
      },


      {
        path: 'generic',
        loadComponent: () => import('./settings/generic-type/generic-type.component').then((c) => c.GenericTypeComponent),
        // CHANGE: permissions - require PRODUCTION:base_type:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'qcr',
        loadComponent: () => import('./settings/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent),
        // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRULE:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRULE, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'storage',
        loadChildren: () => import('./storage/storage-routing.module').then(m => m.StorageRoutingModule),
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'fournisseur',
        loadComponent: () => import('./reception/suppliers/supplier-details/supplier-details.component').then((c) => c.SupplierDetailsComponent),
        // CHANGE: permissions - require RECEPTION:SUPPLIER:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },



      {
        path: 'reception',
        children: receptionRoutes
      },

      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
      }, {
        path: 'hr',
        loadChildren: () => import('./hr/hr.module').then(m => m.HrModule)
      }, {
        path: 'finance',
        loadChildren: () => import('./finance/finance-routing.module').then(m => m.FinanceRoutingModule)
      },
      {
        path: 'administration',
        loadChildren: () => import('./administration/administration-routing.module').then(m => m.AdministrationRoutingModule)
      }

    ]
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/authentication.module').then((e) => e.AuthenticationModule),
  },
  {
    path: '**',
    loadComponent: () => import('./theme/pages/maintenance/error/error.component').then((c) => c.ErrorComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

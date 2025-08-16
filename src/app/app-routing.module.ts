// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
 import { AuthGuardChild } from './interceptors/guards/auth.guard';

//Type
import { Role } from './theme/types/role';
import { receptionRoutes } from './reception/reception.routes';
import { FinanceRoutingModule } from './finance/finance-routing.module';
import { SupplierDetailsComponent } from './reception/components/suppliers/supplier-details/supplier-details.component';
import { AdminComponent } from './theme/layouts/admin/admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [

      {
        path: '',
        loadChildren: () => import('./theme/pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: { roles: [Role.Admin, Role.User] }
      },




      {
        path: 'generic',
        loadComponent: () => import('./settings/generic-type/generic-type.component').then((c) => c.GenericTypeComponent),
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'qcr',
        loadComponent: () => import('./settings/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent),
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'storage',
        loadChildren: () => import('./storage/storage-routing.module').then(m => m.StorageRoutingModule),
        data: { roles: [Role.Admin, Role.User] }
      },

      {

      path: 'fournisseur',
        loadComponent: () => import('./reception/components/suppliers/supplier-details/supplier-details.component').then((c) => c.SupplierDetailsComponent),
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
export class AppRoutingModule {}

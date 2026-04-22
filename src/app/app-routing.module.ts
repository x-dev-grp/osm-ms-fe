// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
// CHANGE: permissions - import permission guards and enums
import { anyPermissionGuard } from './interceptors/guards/permission.guard';
import { Action, OSMModule, permissionKey, ProductionEntity, ReceptionEntity } from './theme/types/permissions';

//Type
import { Role } from './theme/types/role';
import { receptionRoutes } from './reception/reception.routes';
import { AdminComponent } from './theme/layouts/admin';

const routes: Routes = [
  // {
  //   path: 'welcome',
  //   loadComponent: () =>
  //     import('./welcome/welcome.component').then(m => m.WelcomeComponent),
  // },
  {
    path: 'activate-account',
    loadComponent: () =>
      import('./settings/user-management/components/activate-account/activate-account.component')
        .then((m) => m.ActivateAccountComponent)
  },

  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full'
      },
      {
        path: 'stock',
        loadChildren: () => import('./stock/stock.module').then(m => m.StockModule)
      },
      { path: 'of',
        loadChildren: () => import('./OF/of.module').then(m => m.OfModule) },
      {
        path: 'labels',
        loadChildren: () => import('./labels/labels.module').then((m) => m.LabelsModule)
      },
      {
        path: 'projets',
        loadChildren: () => import('./projet/projet.module').then((m) => m.ProjetModule)
      },
      {
        path: 'welcome',
        loadComponent: () => import('./welcome/welcome.component').then((m) => m.WelcomeComponent)
      },

      {
        path: 'access-denied',
        loadComponent: () => import('./theme/layouts/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent)
      },

      {
        path: 'generic',
        loadComponent: () => import('./settings/generic-type/generic-type.component').then((c) => c.GenericTypeComponent), // CHANGE: permissions - require PRODUCTION:base_type:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'qcr',
        loadComponent: () =>
          import('./settings/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent), // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRULE:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRULE, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'storage',
        loadChildren: () => import('./storage/storage-routing.module').then((m) => m.StorageRoutingModule),
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'fournisseur',
        loadComponent: () =>
          import('./reception/suppliers/supplier-details/supplier-details.component').then((c) => c.SupplierDetailsComponent), // CHANGE: permissions - require RECEPTION:SUPPLIER:READ
        canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'stock/par-emplacement',
        loadComponent: () => import('./stock/components/stock-par-emplacement/stock-par-emplacement.component')
          .then(m => m.StockParEmplacementComponent)
      },

      {
        path: 'reception',
        children: receptionRoutes
      },

      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule)
      },
      {
        path: 'hr',
        loadChildren: () => import('./hr/hr.module').then((m) => m.HrModule)
      },
      {
        path: 'finance',
        loadChildren: () => import('./finance/finance-routing.module').then((m) => m.FinanceRoutingModule)
      },
      {
        path: 'administration',
        loadChildren: () => import('./administration/administration-routing.module').then((m) => m.AdministrationRoutingModule)
      }
    ]
  },


  {
    path: 'auth',
    loadChildren: () => import('./auth/authentication.module').then((e) => e.AuthenticationModule)
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



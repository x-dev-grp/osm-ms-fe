// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
// CHANGE: permissions - import permission guards and enums
import { AuthGuardChild } from './interceptors/guards/auth.guard';
import { anyPermissionGuard, moduleGuard } from './interceptors/guards/permission.guard';
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
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuardChild],
    children: [
      {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full'
      },
      {
        path: 'stock',
        loadChildren: () => import('./stock/stock.module').then(m => m.StockModule),
        canActivate: [moduleGuard([OSMModule.INVENTAIR])]
      },
      { path: 'of',
        loadChildren: () => import('./OF/of.module').then(m => m.OfModule),
        canActivate: [moduleGuard([OSMModule.CONDITIONING])] },
      {
        path: 'labels',
        loadChildren: () => import('./labels/labels.module').then((m) => m.LabelsModule),
        canActivate: [moduleGuard([OSMModule.CONDITIONING])]
      },
      {
        path: 'projets',
        loadChildren: () => import('./projet/projet.module').then((m) => m.ProjetModule),
        canActivate: [moduleGuard([OSMModule.CONDITIONING])]
      },
      {
        path: 'welcome',
        loadComponent: () => import('./home-dashboard/home-dashboard.component').then((m) => m.HomeDashboardComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notification-center.component').then((m) => m.NotificationCenterComponent)
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./messages/messages-center.component').then((m) => m.MessagesCenterComponent)
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
        canActivate: [moduleGuard([OSMModule.PRODUCTION])],
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
        canActivate: [moduleGuard([OSMModule.RECEPTION])],
        children: receptionRoutes
      },

      {
        path: 'account/profile',
        canActivate: [AuthGuardChild],
        loadComponent: () => import('./settings/user-profile/user-profile.component').then((c) => c.UserProfileComponent)
      },
      {
        path: 'settings/profile',
        canActivate: [AuthGuardChild],
        loadComponent: () => import('./settings/user-profile/user-profile.component').then((c) => c.UserProfileComponent)
      },

      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule),
        canActivate: [moduleGuard([OSMModule.HABILITATION])]
      },
      {
        path: 'hr',
        loadChildren: () => import('./hr/hr.module').then((m) => m.HrModule),
        canActivate: [moduleGuard([OSMModule.HR])]
      },
      {
        path: 'finance',
        loadChildren: () => import('./finance/finance-routing.module').then((m) => m.FinanceRoutingModule),
        canActivate: [moduleGuard([OSMModule.FINANCE])]
      },
      {
        path: 'administration',
        loadChildren: () => import('./administration/administration-routing.module').then((m) => m.AdministrationRoutingModule)
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./maintenance/maintenance-routing.module').then((m) => m.MaintenanceRoutingModule),
        canActivate: [moduleGuard([OSMModule.PRODUCTION])]
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('./analytics/analytics.module').then(m => m.AnalyticsModule),
        canActivate: [moduleGuard([OSMModule.CONDITIONING])]
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



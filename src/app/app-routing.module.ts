// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
// CHANGE: permissions - import permission guards and enums
import { AuthGuardChild } from './interceptors/guards/auth.guard';
import { anyPermissionGuard, moduleGuard } from './interceptors/guards/permission.guard';
import { Action, OOSMModule, permissionKey, ProductionEntity, ReceptionEntity, HREntity } from './theme/types/permissions';

//Type
import { Role } from './theme/types/role';
import { receptionRoutes } from './reception/reception.routes';
import { AdminComponent } from './theme/layouts/admin';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuardChild],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-hub/dashboard-hub.component').then((m) => m.DashboardHubComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'dashboard/:tabId',
        loadComponent: () => import('./dashboard-hub/dashboard-hub.component').then((m) => m.DashboardHubComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'welcome',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'stock',
        loadChildren: () => import('./stock/stock.module').then(m => m.StockModule),
        canActivate: [moduleGuard([OOSMModule.INVENTAIR])]
      },
      { path: 'of',
        loadChildren: () => import('./OF/of.module').then(m => m.OfModule),
        canActivate: [moduleGuard([OOSMModule.CONDITIONING])] },
      {
        path: 'labels',
        loadChildren: () => import('./labels/labels.module').then((m) => m.LabelsModule),
        canActivate: [moduleGuard([OOSMModule.CONDITIONING])]
      },
      {
        path: 'projets',
        loadChildren: () => import('./projet/projet.module').then((m) => m.ProjetModule),
        canActivate: [moduleGuard([OOSMModule.CONDITIONING])]
      },
      {
        path: 'help',
        loadComponent: () => import('./help/help.component').then((m) => m.HelpComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notification-center.component').then((m) => m.NotificationCenterComponent)
      },

      {
        path: 'access-denied',
        loadComponent: () => import('./theme/layouts/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent)
      },

      {
        path: 'generic',
        loadComponent: () => import('./settings/generic-type/generic-type.component').then((c) => c.GenericTypeComponent), // CHANGE: permissions - require PRODUCTION:base_type:READ
        canActivate: [anyPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'qcr',
        loadComponent: () =>
          import('./settings/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent), // CHANGE: permissions - require PRODUCTION:QUALITYCONTROLRULE:READ
        canActivate: [anyPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRULE, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'storage',
        loadChildren: () => import('./storage/storage-routing.module').then((m) => m.StorageRoutingModule),
        canActivate: [moduleGuard([OOSMModule.PRODUCTION])],
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'fournisseur',
        loadComponent: () =>
          import('./reception/suppliers/supplier-details/supplier-details.component').then((c) => c.SupplierDetailsComponent), // CHANGE: permissions - require RECEPTION:SUPPLIER:READ
        canActivate: [anyPermissionGuard([permissionKey(OOSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.READ)])],
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'stock/par-emplacement',
        loadComponent: () => import('./stock/components/stock-par-emplacement/stock-par-emplacement.component')
          .then(m => m.StockParEmplacementComponent)
      },

      {
        path: 'reception',
        canActivate: [moduleGuard([OOSMModule.RECEPTION])],
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
        canActivate: [moduleGuard([OOSMModule.HABILITATION])]
      },
      {
        path: 'finance',
        loadChildren: () => import('./finance/finance-routing.module').then((m) => m.FinanceRoutingModule),
        canActivate: [moduleGuard([OOSMModule.FINANCE])]
      },
      {
        path: 'administration',
        loadChildren: () => import('./administration/administration-routing.module').then((m) => m.AdministrationRoutingModule)
      },
      {
        path: 'administration/dashboard',
        redirectTo: '/dashboard/administration',
        pathMatch: 'full'
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./maintenance/maintenance-routing.module').then((m) => m.MaintenanceRoutingModule),
        canActivate: [moduleGuard([OOSMModule.PRODUCTION])]
      },
      {
        path: 'mill-equipment',
        loadChildren: () =>
          import('./mill-equipment/mill-equipment-routing.module').then((m) => m.MillEquipmentRoutingModule),
        canActivate: [moduleGuard([OOSMModule.PRODUCTION])]
      },
      {
        path: 'equipment-missions',
        loadChildren: () =>
          import('./equipment-missions/equipment-missions-routing.module').then((m) => m.EquipmentMissionsRoutingModule),
        canActivate: [moduleGuard([OOSMModule.PRODUCTION])]
      },
      {
        path: 'hr',
        loadChildren: () => import('./hr/hr-routing.module').then((m) => m.HrRoutingModule),
        canActivate: [moduleGuard([OOSMModule.HR])]
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('./analytics/analytics.module').then(m => m.AnalyticsModule),
        canActivate: [moduleGuard([OOSMModule.CONDITIONING])]
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



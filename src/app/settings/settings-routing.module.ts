import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
import { Action, HabilitationEntity, OSMModule, permissionKey, ProductionEntity } from 'src/app/theme/types/permissions';
import { UserResolver } from './user-management/services/user.resolver';
import { RoleResolver } from './user-management/services/role.resolver';
import { qualityControlRoutes } from './quality-control-rule/qualityControlQualityRule.routes';

const routes: Routes = [
  {
    path: 'general-config',
    canActivate: [AuthGuardChild],
    loadComponent: () => import('./general-config/general-config.component').then((c) => c.GeneralConfigComponent)
  },
  {
    path: 'quality-control',
    canActivateChild: [AuthGuardChild],
    children: qualityControlRoutes
  },
  {
    path: 'configuration',
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, 'PARAMETER', Action.READ)])],
    loadComponent: () => import('./application-config/application-config.component').then((c) => c.ApplicationConfigComponent)
  },
  {
    path: 'generic',
    canActivateChild: [AuthGuardChild],
    children: [
      {
        path: '',
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])],
        loadComponent: () => import('./generic-type/generic-type.component').then((c) => c.GenericTypeComponent)
      },
      {
        path: 'new',
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.CREATE)])],
        loadComponent: () =>
          import('./generic-type/generic-type-form/generic-type-form.component').then((c) => c.GenericTypeFormComponent)
      },
      {
        path: ':id/edit',
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.UPDATE)])],
        loadComponent: () =>
          import('./generic-type/generic-type-form/generic-type-form.component').then((c) => c.GenericTypeFormComponent)
      },
      {
        path: ':id/view',
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])],
        loadComponent: () =>
          import('./generic-type/generic-type-form/generic-type-form.component').then((c) => c.GenericTypeFormComponent)
      }
    ]
  },
  {
    path: 'users',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.READ)])],
        loadComponent: () => import('./user-management/user-mangement.component').then((c) => c.UserManagementComponent)
      },
      {
        path: 'add',
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.CREATE)])
        ],
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent)
      },
      {
        path: 'update/:id',
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.UPDATE)])
        ],
        resolve: { user: UserResolver },
        data: {
          updateMode: true
        },
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent)
      },
      {
        path: 'view/:id',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.READ)])],
        resolve: { user: UserResolver },
        data: {
          viewMode: true
        },
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent)
      }
    ]
  },
  {
    path: 'roles',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.READ)])],
        loadComponent: () =>
          import('./user-management/components/role-dashboard/role-dashboard.component').then((c) => c.RoleDashboardComponent)
      },
      {
        path: 'add',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.CREATE)])],
        loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent)
      },
      {
        path: 'update/:id',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.UPDATE)])],
        resolve: { role: RoleResolver },
        data: {
          updateMode: true
        },
        loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent)
      },
      {
        path: 'view/:id',
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.READ)])],
        resolve: { role: RoleResolver },
        data: {
          viewMode: true
        },
        loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

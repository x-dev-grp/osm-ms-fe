import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralConfigComponent } from './general-config/general-config.component';
import { GenericTypeComponent } from './generic-type/generic-type.component';
import { ApplicationConfigComponent } from './application-config/application-config.component';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
// CHANGE: permissions - import permission guards
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { Action, HabilitationEntity, OSMModule, permissionKey, ProductionEntity } from 'src/app/theme/types/permissions';
import { UserResolver } from './user-management/services/user.resolver';
import { RoleResolver } from './user-management/services/role.resolver';
import { qualityControlRoutes } from './quality-control-rule/qualityControlQualityRule.routes';
import { GenericTypeFormComponent } from './generic-type/generic-type-form/generic-type-form.component';

const routes: Routes = [
  { path: 'general-config', component: GeneralConfigComponent, canActivate: [AuthGuardChild] },
  {
    path: 'profile',
    canActivate: [AuthGuardChild],
    loadComponent: () => import('./user-profile/user-profile.component').then((c) => c.UserProfileComponent)
  },
  {
    path: 'quality-control',
    canActivateChild: [AuthGuardChild], // 👈 meilleure pratique
    children: qualityControlRoutes
  }, // CHANGE: permissions - require HABILITATION:PARAMETER:READ to access app configuration
  {
    path: 'configuration',
    component: ApplicationConfigComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, 'PARAMETER', Action.READ)])]
  }, // CHANGE: permissions - PRODUCTION:base_type:READ for generic types
  {
    path: 'generic',
    canActivateChild: [AuthGuardChild],
    children: [
      {
        path: '',
        component: GenericTypeComponent,
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])]
      },
      {
        path: 'new',
        component: GenericTypeFormComponent,
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.CREATE)])]
      },
      {
        path: ':id/edit',
        component: GenericTypeFormComponent,
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.UPDATE)])]
      },
      {
        path: ':id/view',
        component: GenericTypeFormComponent,
        canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.base_type, Action.READ)])]
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
        path: 'dashboard', // CHANGE: permissions - HABILITATION:OSMUSER:READ for users dashboard
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.READ)])],
        loadComponent: () => import('./user-management/user-mangement.component').then((c) => c.UserManagementComponent)
      },
      {
        path: 'add', // CHANGE: permissions - HABILITATION:OSMUSER:CREATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.OSMUSER, Action.CREATE)])
        ],
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent)
      },
      {
        path: 'update/:id', // CHANGE: permissions - HABILITATION:OSMUSER:UPDATE
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
        path: 'view/:id', // CHANGE: permissions - HABILITATION:OSMUSER:READ
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
        path: 'dashboard', // CHANGE: permissions - HABILITATION:ROLE:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.READ)])],
        loadComponent: () =>
          import('./user-management/components/role-dashboard/role-dashboard.component').then((c) => c.RoleDashboardComponent)
      },
      {
        path: 'add', // CHANGE: permissions - HABILITATION:ROLE:CREATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.CREATE)])],
        loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent)
      },
      {
        path: 'update/:id', // CHANGE: permissions - HABILITATION:ROLE:UPDATE
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.HABILITATION, HabilitationEntity.ROLE, Action.UPDATE)])],
        resolve: { role: RoleResolver },
        data: {
          updateMode: true
        },
        loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent)
      },
      {
        path: 'view/:id', // CHANGE: permissions - HABILITATION:ROLE:READ
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

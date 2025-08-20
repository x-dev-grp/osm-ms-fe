import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GeneralConfigComponent} from './general-config/general-config.component';
import {GenericTypeComponent} from './generic-type/generic-type.component';
import {ApplicationConfigComponent} from './application-config/application-config.component';
import {AuthGuardChild} from '../interceptors/guards/auth.guard';
import {UserResolver} from './user-management/services/user.resolver';
import {RoleResolver} from './user-management/services/role.resolver';
import {qualityControlRoutes} from "./quality-control-rule/qualityControlQualityRule.routes";
import { AddBasetypeComponent } from './generic-type/add-basetype/add-basetype.component';

const routes: Routes = [
  { path: 'general-config', component: GeneralConfigComponent, canActivate: [AuthGuardChild] },
  {
    path: 'quality-control',
    canActivateChild: [AuthGuardChild], // 👈 meilleure pratique
    children: qualityControlRoutes
  },
  { path: 'configuration', component: ApplicationConfigComponent, canActivate: [AuthGuardChild] },
  { path: 'generic', component: GenericTypeComponent, canActivate: [AuthGuardChild] },
  {
    path: 'generic',
     children: [
      { path: 'new', component: AddBasetypeComponent,  },
      { path: ':id/edit', component: AddBasetypeComponent,   }
    ]
  },

  {
    path: 'users',
    children:[
      {
        path: '',
        redirectTo:'dashboard',
        pathMatch:'full'
      },
      {
        path: 'dashboard',
         canActivate: [AuthGuardChild],
        loadComponent: () => import('./user-management/user-mangement.component').then((c) => c.UserManagementComponent),
      },
      {
        path: 'add',
        canActivate: [AuthGuardChild],
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent),
      },
      {
        path: 'update/:id',
        canActivate: [AuthGuardChild],
        resolve:{user:UserResolver},
        data: {
          updateMode: true,
        },
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent),
      }
      ,
      {
        path: 'view/:id',
        canActivate: [AuthGuardChild],
        resolve:{user:UserResolver},
        data: {
          viewMode: true,
        },
        loadComponent: () => import('./user-management/components/form/user-form.component').then((c) => c.UserFormComponent),
      }
    ] },
  {
    path: 'roles',
      children:[
        {
          path: '',
          redirectTo:'dashboard',
          pathMatch:'full'
        },
        {
          path: 'dashboard',
           canActivate: [AuthGuardChild],
          loadComponent: () => import('./user-management/components/role-dashboard/role-dashboard.component').then((c) => c.RoleDashboardComponent),
        },
        {
          path: 'add',
          canActivate: [AuthGuardChild],
          loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent),
        },
        {
          path: 'update/:id',
          canActivate: [AuthGuardChild],
          resolve:{role:RoleResolver},
          data: {
            updateMode: true,
          },
          loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent),
        }
        ,
        {
          path: 'view/:id',
          canActivate: [AuthGuardChild],
          resolve:{role:RoleResolver},
          data: {
            viewMode: true,
          },
          loadComponent: () => import('./user-management/components/role-form/role-form.component').then((c) => c.RoleFormComponent),
        }
      ] }

 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

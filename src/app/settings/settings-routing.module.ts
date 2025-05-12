import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralConfigComponent } from './general-config/general-config.component';
 import { StorageUnitsComponent } from './storage/storage.component';
import { GenericTypeComponent } from './generic-type/generic-type.component';
import { QualityControlRuleComponent } from './quality-control-rule/quality-control-rule.component';
import { ApplicationConfigComponent } from './application-config/application-config.component';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';

const routes: Routes = [
  { path: 'general-config', component: GeneralConfigComponent, canActivate: [AuthGuardChild] },
  { path: 'quality-control', component: QualityControlRuleComponent, canActivate: [AuthGuardChild] },
  { path: 'storage', component: StorageUnitsComponent },
  { path: 'configuration', component: ApplicationConfigComponent, canActivate: [AuthGuardChild] },

  { path: 'generic', component: GenericTypeComponent, canActivate: [AuthGuardChild] },
  { path: 'users', 
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
      }
     
    ] }

 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
import { allPermissionGuard } from '../interceptors/guards/permission.guard';
import { Action, OSMModule, permissionKey, ProductionEntity } from '../theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./maintenance-list/maintenance-list.component').then((m) => m.MaintenanceListComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MAINTENANCEWORKORDER, Action.READ)])
    ]
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./maintenance-form/maintenance-form.component').then((m) => m.MaintenanceFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MAINTENANCEWORKORDER, Action.CREATE)])
    ]
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./maintenance-form/maintenance-form.component').then((m) => m.MaintenanceFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MAINTENANCEWORKORDER, Action.UPDATE)])
    ]
  },
  {
    path: ':id/view',
    loadComponent: () =>
      import('./maintenance-form/maintenance-form.component').then((m) => m.MaintenanceFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MAINTENANCEWORKORDER, Action.READ)])
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaintenanceRoutingModule {}

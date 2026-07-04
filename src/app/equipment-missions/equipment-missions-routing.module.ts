import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
import { allPermissionGuard } from '../interceptors/guards/permission.guard';
import { Action, OOSMModule, permissionKey, ProductionEntity } from '../theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../maintenance/equipment-missions/mission-list.component').then((m) => m.MissionListComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.EQUIPMENTSERVICEMISSION, Action.READ)])
    ]
  },
  {
    path: 'new',
    loadComponent: () =>
      import('../maintenance/equipment-missions/mission-form.component').then((m) => m.MissionFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.EQUIPMENTSERVICEMISSION, Action.CREATE)])
    ]
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('../maintenance/equipment-missions/mission-form.component').then((m) => m.MissionFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.EQUIPMENTSERVICEMISSION, Action.UPDATE)])
    ]
  },
  {
    path: ':id/view',
    loadComponent: () =>
      import('../maintenance/equipment-missions/mission-form.component').then((m) => m.MissionFormComponent),
    canActivate: [
      AuthGuardChild,
      allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.EQUIPMENTSERVICEMISSION, Action.READ)])
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EquipmentMissionsRoutingModule {}

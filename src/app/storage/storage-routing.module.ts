import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
// CHANGE: permissions - import permission guards
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { Action, OOSMModule, permissionKey, ProductionEntity } from 'src/app/theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./storage.component').then((m) => m.StorageUnitsComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'new',
        loadComponent: () => import('./storage-add/storage-add.component').then((m) => m.StorageAddComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:CREATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.CREATE)])
        ]
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./storage-add/storage-add.component').then((m) => m.StorageAddComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:UPDATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.UPDATE)])
        ]
      },
      {
        path: ':id/view',
        loadComponent: () => import('./view-storage/view-storage.component').then((m) => m.ViewStorageComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'oil-transaction/:id',
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ)])
        ],
        loadComponent: () =>
          import('./oil-transactions/view-oil-transaction/view-oil-transaction.component').then((m) => m.ViewOilTransactionComponent)
      },
      {
        path: 'oil-transactions',
        loadComponent: () => import('./oil-transactions/oil-transactions.component').then((m) => m.OilTransactionsComponent),
        // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:READ
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ)])
        ]
      },
      {
        path: 'storage_recap',
        loadComponent: () => import('./storage-units-board/storage-units-board.component').then((m) => m.StorageUnitsBoardComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },

      {
        path: 'oil-transactions/:id/view',
        loadComponent: () =>
          import('./oil-transactions/view-oil-transaction/view-oil-transaction.component').then((m) => m.ViewOilTransactionComponent),
        // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:READ
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ)])
        ]
      },
      {
        path: 'oil-transactions/new',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:CREATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.CREATE)])
        ]
      },
      {
        path: 'oil-transactions/:id/edit',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:UPDATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.UPDATE)])
        ]
      },
      {
        path: 'oil-transactions/:id/validate',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        // CHANGE: permissions - require PRODUCTION:OILTRANSACTION:VALIDATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.VALIDATE)])
        ]
      },
      {
        path: 'oil-container',
        loadComponent: () => import('./oil-container/oil-container.component').then((m) => m.OilContainerComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ (container listing bound to storage perms)
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },

      {
        path: 'oil-container/:id/view',
        loadComponent: () =>
          import('./oil-container/view-oil-container/view-oil-container.component').then((m) => m.ViewOilContainerComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'oil-container/new',
        loadComponent: () =>
          import('./oil-container/add-oil-container/add-oil-container.component').then((m) => m.AddOilContainerComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:CREATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.CREATE)])
        ]
      },
      {
        path: 'oil-container/:id/edit',
        loadComponent: () =>
          import('./oil-container/add-oil-container/add-oil-container.component').then((m) => m.AddOilContainerComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:UPDATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.UPDATE)])
        ]
      },
      {
        path: 'oil-filtering',
        loadComponent: () => import('./filtration/filtration-list.component').then((m) => m.FiltrationListComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ (container listing bound to storage perms)
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },

      {
        path: 'oil-filtering/:id/view',
        loadComponent: () => import('./filtration/filtration-detail/filtration-detail.component').then((m) => m.FiltrationDetailComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'oil-filtering/:id/edit',
        loadComponent: () => import('./filtration/filtration-form/filtration-form.component').then((m) => m.FiltrationFormComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:READ
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'oil-filtering/new',
        loadComponent: () => import('./filtration/filtration-form/filtration-form.component').then((m) => m.FiltrationFormComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:CREATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.CREATE)])
        ]
      },
      {
        path: 'oil-filtering/:id/traceability',
        loadComponent: () =>
          import('./filtration/traceability/filtration-traceability-page.component').then((m) => m.FiltrationTraceabilityPageComponent),
        canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ)])]
      },
      {
        path: 'oil-filtering/:id/quality',
        loadComponent: () =>
          import('./filtration/quality/filtration-controle-qualite.component').then((m) => m.FiltrationControleQualiteComponent),
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRESULT, Action.READ)])
        ]
      },
      {
        path: 'oil-container/:id/edit',
        loadComponent: () => import('./filtration/filtration-form/filtration-form.component').then((m) => m.FiltrationFormComponent),
        // CHANGE: permissions - require PRODUCTION:STORAGEUNIT:UPDATE
        canActivate: [
          AuthGuardChild,
          allPermissionGuard([permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.UPDATE)])
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StorageRoutingModule {}

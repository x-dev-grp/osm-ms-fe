import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./storage.component').then((m) => m.StorageUnitsComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'new',
        loadComponent: () => import('./storage-add/storage-add.component').then((m) => m.StorageAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./storage-add/storage-add.component').then((m) => m.StorageAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: ':id/view',
        loadComponent: () => import('./view-storage/view-storage.component').then((m) => m.ViewStorageComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-transaction/:id',
        canActivate: [AuthGuardChild],
        loadComponent: () =>
          import('./oil-transactions/view-oil-transaction/view-oil-transaction.component').then((m) => m.ViewOilTransactionComponent)
      },
      {
        path: 'oil-transactions',
        loadComponent: () => import('./oil-transactions/oil-transactions.component').then((m) => m.OilTransactionsComponent),
        canActivate: [AuthGuardChild]
      },

      {
        path: 'oil-transactions/:id/view',
        loadComponent: () =>
          import('./oil-transactions/view-oil-transaction/view-oil-transaction.component').then((m) => m.ViewOilTransactionComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-transactions/new',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-transactions/:id/edit',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-transactions/:id/validate',
        loadComponent: () =>
          import('./oil-transactions/oil-transaction-add/oil-transaction-add.component').then((m) => m.OilTransactionAddComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-container',
        loadComponent: () => import('./oil-container/oil-container.component').then((m) => m.OilContainerComponent),
        canActivate: [AuthGuardChild]
      },

      {
        path: 'oil-container/:id/view',
        loadComponent: () =>
          import('./oil-container/view-oil-container/view-oil-container.component').then((m) => m.ViewOilContainerComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-container/new',
        loadComponent: () =>
          import('./oil-container/add-oil-container/add-oil-container.component').then((m) => m.AddOilContainerComponent),
        canActivate: [AuthGuardChild]
      },
      {
        path: 'oil-container/:id/edit',
        loadComponent: () =>
          import('./oil-container/add-oil-container/add-oil-container.component').then((m) => m.AddOilContainerComponent),
        canActivate: [AuthGuardChild]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StorageRoutingModule {}

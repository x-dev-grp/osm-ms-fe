// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//type
import { Role } from 'src/app/theme/types/role';
import { AuthGuardChild } from 'src/app/interceptors/guards/auth.guard';
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { OSMModule, ReceptionEntity, Action, permissionKey } from 'src/app/theme/types/permissions';

const routes: Routes = [
  {
    path: '',
    redirectTo: "dashboard",
    pathMatch: "full"
  },
  {
    path: "dashboard",
    canActivateChild: [AuthGuardChild],
    children: [
      {
        path: '',
        loadComponent: () => import('./default/default.component').then((c) => c.DefaultComponent),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/analytics.component').then((c) => c.AnalyticsComponent),
        data: { roles: [Role.Admin] },
        // CHANGE: permissions - require RECEPTION:UNIFIEDDELIVERY:DELETE
        canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.DELETE)])]
      },
      {
        path: 'finance',
        loadComponent: () => import('./finance/finance.component').then((c) => c.FinanceComponent),
        data: { roles: [Role.Admin] }
      }
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

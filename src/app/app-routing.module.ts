// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
import { AdminComponent } from './demo/layout/admin';
import { AuthGuardChild } from './interceptors/guards/auth.guard';

//Type
import { Role } from './@theme/types/role';
import { receptionRoutes } from './reception/reception.routes';

const routes: Routes = [
  {
    path: '',
   // canActivateChild: [AuthGuardChild],
   redirectTo:"dashboard",
   pathMatch:'full',

  },
  {
    path: '',
    loadChildren: () => import('./demo/pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'widget',
    loadChildren: () => import('./demo/pages/widget/widget.module').then((m) => m.WidgetModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'online-course',
    loadChildren: () => import('./demo/pages/admin-panel/online-courses/online-courses.module').then((m) => m.OnlineCoursesModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'membership',
    loadChildren: () => import('./demo/pages/admin-panel/membership/membership.module').then((m) => m.MembershipModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'helpdesk',
    loadChildren: () => import('./demo/pages/admin-panel/helpdesk/helpdesk.module').then((m) => m.HelpdeskModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'invoice',
    loadChildren: () => import('./demo/pages/admin-panel/invoice/invoice.module').then((m) => m.InvoiceModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'application',
    loadChildren: () => import('./demo/pages/application/application.module').then((m) => m.ApplicationModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'apex-chart',
    loadComponent: () => import('./demo/pages/chart/apex-charts/apex-charts.component').then((c) => c.ApexChartsComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'material-table',
    loadComponent: () => import('./demo/pages/material-table/material-table.component').then((c) => c.MaterialTableComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'generic',
    loadComponent: () => import('./osm/generic-type/generic-type.component').then((c) => c.GenericTypeComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'delivery',
    loadComponent: () => import('./osm/delivery/delivery.component').then((c) => c.DeliveryComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'qcr',
    loadComponent: () => import('./osm/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'planning',
    loadComponent: () => import('./osm/planning/planning.component').then((c) => c.PlanningComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'storage',
    loadComponent: () => import('./osm/storage/storage.component').then((c) => c.StorageUnitsComponent),
    data: { roles: [Role.Admin, Role.User] }
  },

  {
    path: 'forms',
    loadChildren: () => import('./demo/pages/forms/forms.module').then((m) => m.FormsModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'price',
    loadChildren: () => import('./demo/pages/price/price-routing.module').then((m) => m.PriceRoutingModule),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'sample-page',
    loadComponent: () => import('./demo/pages/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
    data: { roles: [Role.Admin, Role.User] }
  },

  {
    path: 'reception',
    children: receptionRoutes
  },
  {
    path: 'millers',
    loadComponent: () => import('./osm/millmachin/millmachin.component').then((c) => c.MillMachineComponent),
    data: { roles: [Role.Admin, Role.User] }
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule)
  },

  {
    path: 'login',
    loadChildren: () => import('./auth/authentication.module').then((e) => e.AuthenticationModule),

  },

  {
    path: '**',
    loadComponent: () => import('./demo/pages/maintenance/error/error.component').then((c) => c.ErrorComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// project import
import { AdminComponent } from './demo/layout/admin';
import { EmptyComponent } from './demo/layout/empty/empty.component';
import { AuthGuardChild } from './@theme/helpers/auth.guard';

//Type
import { Role } from './@theme/types/role';
import {receptionRoutes} from "./reception/reception.routes";

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivateChild: [AuthGuardChild],
    children: [
      {
        path: '',
        loadChildren: () => import('./demo/pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
        data: { roles: [Role.Admin, Role.User] }
      },

      {
        path: 'dashboard',
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
      },{
        path: 'generic',
        loadComponent: () => import('./osm/generic-type/generic-type.component').then((c) => c.GenericTypeComponent),
        data: { roles: [Role.Admin, Role.User] }
      },{
        path: 'delivery',
        loadComponent: () => import('./osm/delivery/delivery.component').then((c) => c.DeliveryComponent),
        data: { roles: [Role.Admin, Role.User] }
      },{
        path: 'qcr',
        loadComponent: () => import('./osm/quality-control-rule/quality-control-rule.component').then((c) => c.QualityControlRuleComponent),
        data: { roles: [Role.Admin, Role.User] }
      },{
        path: 'supplier',
        loadComponent: () => import('./osm/supplier/supplier.component').then((c) => c.SupplierComponent),
        data: { roles: [Role.Admin, Role.User] }
      },{
        path: 'millers',
        loadComponent: () => import('./osm/millmachin/millmachin.component').then((c) => c.MillMachineComponent),
        data: { roles: [Role.Admin, Role.User] }
      },{
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
      }
    ]

  },

  {
    path: '',
    component: EmptyComponent,
    children: [
      {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/auth/authentication-1/login/login.component').then((c) => c.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./demo/pages/auth/authentication-1/register/register.component').then((c) => c.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./demo/pages/auth/authentication-1/forgot-password/forgot-password.component').then((c) => c.ForgotPasswordComponent)
      },
      {
        path: 'authentication-1',
        canActivateChild: [AuthGuardChild],
        loadChildren: () => import('./demo/pages/auth/authentication-1/authentication-1.module').then((e) => e.Authentication1Module),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'authentication-2',
        canActivateChild: [AuthGuardChild],
        loadChildren: () => import('./demo/pages/auth/authentication-2/authentication-2.module').then((e) => e.Authentication2Module),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'authentication-3',
        canActivateChild: [AuthGuardChild],
        loadComponent: () =>
          import('./demo/pages/auth/authentication-3/authentication-three.component').then((c) => c.AuthenticationThreeComponent),
        data: { roles: [Role.Admin, Role.User] }
      },
      {
        path: 'maintenance',
        loadChildren: () => import('./demo/pages/maintenance/maintenance.module').then((m) => m.MaintenanceModule)
      },
      {
        path: 'unauthorized',
        loadComponent: () => import('./demo/pages/maintenance/error-401/error-401.component').then((c) => c.Error401Component)
      }
    ]
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

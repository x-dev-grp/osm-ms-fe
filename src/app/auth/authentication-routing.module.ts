// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// type
import { AuthGuardLogin } from '../interceptors/guards/auth-login.guard';

const authroutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        canActivate: [AuthGuardLogin],
        loadComponent: () => import('./login/login.component').then((c) => c.LoginComponent)
      },
      {
        path: 'forgot-password',
        canActivate: [AuthGuardLogin],
        loadComponent: () => import('./forgot-password/forgot-password.component').then((c) => c.ForgotPasswordComponent)
      },
      {
        path: 'user/update-password',
        canActivate: [AuthGuardLogin],
        loadComponent: () => import('./update-password/update-password.component').then((c) => c.UpdatePasswordComponent)
      },
      {
        path: 'reset/:userId',
        loadComponent: () => import('./reset-confirm/reset-confirm.component').then((m) => m.ResetConfirmComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(authroutes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule {}

// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// type
import { Role } from 'src/app/theme/types/role';
import { AuthGuardLogin } from '../interceptors/guards/auth-login.guard';
import { AuthGuardPassword } from '../interceptors/guards/auth-update-password.guard';

const authroutes: Routes = [
  {
    path:'',
    children:[
      {
        path: '',
        redirectTo:'login',
        pathMatch:'full'
      },
      {
        path: 'login',
        canActivate:[AuthGuardLogin],
        loadComponent: () => import('./login/login.component').then((c) => c.LoginComponent),
      },
      // {
      //   path: 'register',
      //   loadComponent: () => import('./register/register.component').then((c) => c.RegisterComponent),
      //   //data: { roles: [Role.Admin, Role.User] }
      // },
      // {
      //   path: 'forgot-password',
      //   canActivate:[AuthGuardLogin],
      //   loadComponent: () => import('./forgot-password/forgot-password.component').then((c) => c.ForgotPasswordComponent),
      //   data: { roles: [Role.Admin, Role.User] }
      // },
      // {
      //   path: 'reset-password',
      //   canActivate:[AuthGuardLogin],
      //   loadComponent: () => import('./reset-password/reset-password.component').then((c) => c.ResetPasswordComponent),
      //   data: { roles: [Role.Admin, Role.User] }
      // },
      // {
      //   path: 'check-mail',
      //   canActivate:[AuthGuardLogin],
      //   loadComponent: () => import('./check-mail/check-mail.component').then((c) => c.CheckMailComponent),
      //   data: { roles: [Role.Admin, Role.User] }
      // },
      // {
      //   path: 'code-verify',
      //   canActivate:[AuthGuardLogin],
      //   loadComponent: () => import('./code-verification/code-verification.component').then((c) => c.CodeVerificationComponent),
      //   data: { roles: [Role.Admin, Role.User] }
      // },
      {
        path: 'user/update-password',
        canActivate:[AuthGuardLogin],
        loadComponent: () => import('./update-password/update-password.component').then((c) => c.UpdatePasswordComponent),
      },

    ]
  }



];

@NgModule({
  imports: [RouterModule.forChild(authroutes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule {}

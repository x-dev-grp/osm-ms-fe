import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {DashboardComponent} from "./components/dashboard/dashboard.component";
import {SignupComponent} from "./components/signup/signup.component";
import {PasswordResetComponent} from "./components/password-reset/password-reset.component";
import {GenericTypeComponent} from "../../../datta-able-free-angular-admin-template/src/app/demo/test/components/generic-type/generic-type.component";
import {SupplierComponent} from "./components/supplier/supplier.component";
import {QualityControlRuleComponent} from "./components/quality-control-rule/quality-control-rule.component";
import {DeliveryComponent} from "./components/delivery/delivery.component";

const routes: Routes = [{path: 'login', component: LoginComponent},
  {path: 'generic', component: GenericTypeComponent},
  {path: 'supplier', component: SupplierComponent},
  {path: 'qcr', component: QualityControlRuleComponent},
  {path: 'del', component: DeliveryComponent},
  {path: 'signup',  component: SignupComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'set-password', component: PasswordResetComponent}, // Default & wildcard
  {path: '', redirectTo: '/login', pathMatch: 'full'}, {path: '**', redirectTo: '/login'}];

@NgModule({
  imports: [RouterModule.forRoot(routes)], exports: [RouterModule]
})
export class AppRoutingModule {
}

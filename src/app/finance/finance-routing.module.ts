
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './expenses/expenses.component';
import { PricingComponent } from './pricing/pricing.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { ViewExpenseComponent } from './expenses/view-expense/view-expense.component';
import { OilCreditComponent } from './oil-credit/oil-credit.component';
import { ViewOilCreditComponent } from './oil-credit/view-oil-credit/view-oil-credit.component';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';


const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent , canActivate: [AuthGuardChild]},
  { path: 'expenses/:id/view',  component: ViewExpenseComponent , canActivate: [AuthGuardChild]},
  { path: 'pricing', component: PricingComponent , canActivate: [AuthGuardChild]},
  { path: 'banks', component: BankAccountsComponent , canActivate: [AuthGuardChild]},
  { path: 'oil-credit', component: OilCreditComponent , canActivate: [AuthGuardChild]},
  { path: 'oil-credit/:id/view',  component: ViewOilCreditComponent , canActivate: [AuthGuardChild]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}

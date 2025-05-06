
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './expenses/expenses.component';
import { PricingComponent } from './pricing/pricing.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { ViewExpenseComponent } from './expenses/view-expense/view-expense.component';
import { OilCreditComponent } from './oil-credit/oil-credit.component';
import { ViewOilCreditComponent } from './oil-credit/view-oil-credit/view-oil-credit.component';


const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent },
  { path: 'expenses/:id/view',  component: ViewExpenseComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'banks', component: BankAccountsComponent },
  { path: 'oil-credit', component: OilCreditComponent },
  { path: 'oil-credit/:id/view',  component: ViewOilCreditComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}


import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './expenses/expenses.component';
import { PricingComponent } from './pricing/pricing.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { ViewExpenseComponent } from './expenses/view-expense/view-expense.component';


const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent },
  { path: 'expenses/:id/view',  component: ViewExpenseComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'banks', component: BankAccountsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}

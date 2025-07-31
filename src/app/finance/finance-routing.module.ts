import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './expenses/expenses.component';
import { PricingComponent } from './pricing/pricing.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { ViewExpenseComponent } from './expenses/view-expense/view-expense.component';
import { OilCreditComponent } from './oil-credit/oil-credit.component';
import { ViewOilCreditComponent } from './oil-credit/view-oil-credit/view-oil-credit.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CustomersComponent } from './customers/customers.component';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';


const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent, canActivate: [AuthGuardChild] },
  { path: 'expenses/:id/view', component: ViewExpenseComponent, canActivate: [AuthGuardChild] },
  { path: 'expenses/new', loadComponent: () => import('./expenses/expense-add/expense-add.component').then(m => m.ExpenseAddComponent), canActivate: [AuthGuardChild] },
  { path: 'expenses/:id/edit', loadComponent: () => import('./expenses/expense-add/expense-add.component').then(m => m.ExpenseAddComponent), canActivate: [AuthGuardChild] },
  { path: 'pricing', component: PricingComponent, canActivate: [AuthGuardChild] },
  { path: 'banks', component: BankAccountsComponent, canActivate: [AuthGuardChild] },
  { path: 'banks/:id/view', loadComponent: () => import('./bank-accounts/view-bank-account/view-bank-account.component').then(m => m.ViewBankAccountComponent), canActivate: [AuthGuardChild] },
  { path: 'banks/new', loadComponent: () => import('./bank-accounts/bank-account-add/bank-account-add.component').then(m => m.BankAccountAddComponent), canActivate: [AuthGuardChild] },
  { path: 'banks/:id/edit', loadComponent: () => import('./bank-accounts/bank-account-add/bank-account-add.component').then(m => m.BankAccountAddComponent), canActivate: [AuthGuardChild] },
  { path: 'oil-credit', component: OilCreditComponent, canActivate: [AuthGuardChild] },
  { path: 'oil-credit/new', loadComponent: () => import('./oil-credit/oil-credit-add/oil-credit-add.component').then(m => m.OilCreditAddComponent), canActivate: [AuthGuardChild] },
  { path: 'oil-credit/:id/edit', loadComponent: () => import('./oil-credit/oil-credit-add/oil-credit-add.component').then(m => m.OilCreditAddComponent), canActivate: [AuthGuardChild] },
  { path: 'oil-credit/:id/view', component: ViewOilCreditComponent, canActivate: [AuthGuardChild] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuardChild] },
  { path: 'transactions/:id/view', loadComponent: () => import('./transactions/transaction-view/transaction-view.component').then(m => m.TransactionViewComponent), canActivate: [AuthGuardChild] },
  { path: 'transactions/new', loadComponent: () => import('./transactions/transaction-add/transaction-add.component').then(m => m.TransactionAddComponent), canActivate: [AuthGuardChild] },
  { path: 'transactions/:id/edit', loadComponent: () => import('./transactions/transaction-add/transaction-add.component').then(m => m.TransactionAddComponent), canActivate: [AuthGuardChild] },
  { path: 'customers', component: CustomersComponent, canActivate: [AuthGuardChild] },
  { path: 'customers/:id/view', loadComponent: () => import('./customers/customer-view/customer-view.component').then(m => m.CustomerViewComponent), canActivate: [AuthGuardChild] },
  { path: 'customers/new', loadComponent: () => import('./customers/customer-add/customer-add.component').then(m => m.CustomerAddComponent), canActivate: [AuthGuardChild] },
  { path: 'customers/:id/edit', loadComponent: () => import('./customers/customer-add/customer-add.component').then(m => m.CustomerAddComponent), canActivate: [AuthGuardChild] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}

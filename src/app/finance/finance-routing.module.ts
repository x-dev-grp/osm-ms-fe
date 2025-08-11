import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpensesComponent} from './expenses/expenses.component';
import {BankAccountsComponent} from './bank-accounts/bank-accounts.component';
import {ViewExpenseComponent} from './expenses/view-expense/view-expense.component';
import {OilCreditComponent} from './oil-credit/oil-credit.component';
import {ViewOilCreditComponent} from './oil-credit/view-oil-credit/view-oil-credit.component';
import {TransactionsComponent} from './transactions/transactions.component';
import {CustomersComponent} from './customers/customers.component';
import {OilSalesComponent} from './oil-sales/oil-sales.component';
import {AuthGuardChild} from '../interceptors/guards/auth.guard';
import {WasteComponent} from "./waste/waste.component";


const routes: Routes = [
  { path: 'expenses', component: ExpensesComponent, canActivate: [AuthGuardChild] },
  { path: 'expenses/:id/view', component: ViewExpenseComponent, canActivate: [AuthGuardChild] },
  { path: 'expenses/new', loadComponent: () => import('./expenses/expense-add/expense-add.component').then(m => m.ExpenseAddComponent), canActivate: [AuthGuardChild] },
  { path: 'expenses/:id/edit', loadComponent: () => import('./expenses/expense-add/expense-add.component').then(m => m.ExpenseAddComponent), canActivate: [AuthGuardChild] },
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
  { path: 'customers/:id/details', loadComponent: () => import('./customers/customer-details/customer-details.component').then(m => m.CustomerDetailsComponent), canActivate: [AuthGuardChild] },

  { path: 'oil-sales', component: OilSalesComponent, canActivate: [AuthGuardChild] },
  { path: 'oil-sales/new', loadComponent: () => import('./oil-sales/oil-sale-add/oil-sale-add.component').then(m => m.OilSaleAddComponent), canActivate: [AuthGuardChild] },
  { path: 'oil-sales/:id/edit', loadComponent: () => import('./oil-sales/oil-sale-add/oil-sale-add.component').then(m => m.OilSaleAddComponent), canActivate: [AuthGuardChild] },
  { path: 'oil-sales/:id/view', loadComponent: () => import('./oil-sales/oil-sale-view/oil-sale-view.component').then(m => m.OilSaleViewComponent), canActivate: [AuthGuardChild] },

  {path: 'waste-sales', component: WasteComponent, canActivate: [AuthGuardChild]},
  {
    path: 'waste-sales/new',
    loadComponent: () => import('./waste/waste-add/waste-add.component').then(m => m.WasteAddComponent),
    canActivate: [AuthGuardChild]
  },
  {
    path: 'waste-sales/:id/edit',
    loadComponent: () => import('./waste/waste-add/waste-add.component').then(m => m.WasteAddComponent),
    canActivate: [AuthGuardChild]
  },
  {
    path: 'waste-sales/:id/view',
    loadComponent: () => import('./waste/waste-view/waste-view.component').then(m => m.WasteViewComponent),
    canActivate: [AuthGuardChild]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}

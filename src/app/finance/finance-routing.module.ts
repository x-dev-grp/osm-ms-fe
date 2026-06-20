import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './expenses/expenses.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { ViewExpenseComponent } from './expenses/view-expense/view-expense.component';
import { OilCreditComponent } from './oil-credit/oil-credit.component';
import { ViewOilCreditComponent } from './oil-credit/view-oil-credit/view-oil-credit.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { OilSalesComponent } from './oil-sales/oil-sales.component';
import { AuthGuardChild } from '../interceptors/guards/auth.guard';
// CHANGE: permissions - import permission guards
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { Action, FinanceEntity, OSMModule, permissionKey, ProductionEntity } from 'src/app/theme/types/permissions';
import { WasteComponent } from './waste/waste.component';

const routes: Routes = [
  // CHANGE: permissions - protect dashboard with FINANCE:FINANCIALTRANSACTION:READ
  {
    path: '',
    loadComponent: () => import('./finance-dashboard/finance-dashboard.component').then((m) => m.FinanceDashboardComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)])]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./finance-dashboard/finance-dashboard.component').then((m) => m.FinanceDashboardComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)])]
  },
  // CHANGE: permissions - Expenses
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.READ)])]
  },
  {
    path: 'expenses/:id/view',
    component: ViewExpenseComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.READ)])]
  },
  {
    path: 'expenses/new',
    loadComponent: () => import('./expenses/expense-add/expense-add.component').then((m) => m.ExpenseAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.CREATE)])]
  },
  {
    path: 'expenses/:id/edit',
    loadComponent: () => import('./expenses/expense-add/expense-add.component').then((m) => m.ExpenseAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.EXPENSE, Action.UPDATE)])]
  },
  // CHANGE: permissions - Bank Accounts
  {
    path: 'banks',
    component: BankAccountsComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.BANKACCOUNT, Action.READ)])]
  },
  {
    path: 'banks/:id/view',
    loadComponent: () => import('./bank-accounts/view-bank-account/view-bank-account.component').then((m) => m.ViewBankAccountComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.BANKACCOUNT, Action.READ)])]
  },
  {
    path: 'banks/new',
    loadComponent: () => import('./bank-accounts/bank-account-add/bank-account-add.component').then((m) => m.BankAccountAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.BANKACCOUNT, Action.CREATE)])]
  },
  {
    path: 'banks/:id/edit',
    loadComponent: () => import('./bank-accounts/bank-account-add/bank-account-add.component').then((m) => m.BankAccountAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.BANKACCOUNT, Action.UPDATE)])]
  },
  // CHANGE: permissions - Oil Credit (PRODUCTION:OILCREDIT)
  {
    path: 'oil-credit',
    component: OilCreditComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.OILCREDIT, Action.READ)])]
  },
  {
    path: 'oil-credit/new',
    loadComponent: () => import('./oil-credit/oil-credit-add/oil-credit-add.component').then((m) => m.OilCreditAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.OILCREDIT, Action.CREATE)])]
  },
  {
    path: 'oil-credit/:id/edit',
    loadComponent: () => import('./oil-credit/oil-credit-add/oil-credit-add.component').then((m) => m.OilCreditAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.OILCREDIT, Action.UPDATE)])]
  },
  {
    path: 'oil-credit/:id/view',
    component: ViewOilCreditComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.OILCREDIT, Action.READ)])]
  },
  // CHANGE: permissions - Financial Transactions
  {
    path: 'transactions',
    component: TransactionsComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)])]
  },
  {
    path: 'transactions/:id/view',
    loadComponent: () => import('./transactions/transaction-view/transaction-view.component').then((m) => m.TransactionViewComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ)])]
  },
  {
    path: 'transactions/new',
    loadComponent: () => import('./transactions/transaction-add/transaction-add.component').then((m) => m.TransactionAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.CREATE)])]
  },
  {
    path: 'transactions/:id/edit',
    loadComponent: () => import('./transactions/transaction-add/transaction-add.component').then((m) => m.TransactionAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.UPDATE)])]
  },

  // CHANGE: permissions - Oil Sales
  {
    path: 'oil-sales',
    component: OilSalesComponent,
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ)])]
  },
  {
    path: 'oil-sales/new',
    loadComponent: () => import('./oil-sales/oil-sale-add/oil-sale-add.component').then((m) => m.OilSaleAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.OILSALE, Action.CREATE)])]
  },
  {
    path: 'oil-sales/:id/edit',
    loadComponent: () => import('./oil-sales/oil-sale-add/oil-sale-add.component').then((m) => m.OilSaleAddComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.OILSALE, Action.UPDATE)])]
  },
  {
    path: 'oil-sales/:id/view',
    loadComponent: () => import('./oil-sales/oil-sale-view/oil-sale-view.component').then((m) => m.OilSaleViewComponent),
    canActivate: [AuthGuardChild, allPermissionGuard([permissionKey(OSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ)])]
  },

  // NOTE: permissions - Waste is not mapped in seed; keeping AuthGuard only
  { path: 'waste-sales', component: WasteComponent, canActivate: [AuthGuardChild] },
  {
    path: 'waste-sales/new',
    loadComponent: () => import('./waste/waste-add/waste-add.component').then((m) => m.WasteAddComponent),
    canActivate: [AuthGuardChild]
  },
  {
    path: 'waste-sales/:id/edit',
    loadComponent: () => import('./waste/waste-add/waste-add.component').then((m) => m.WasteAddComponent),
    canActivate: [AuthGuardChild]
  },
  {
    path: 'waste-sales/:id/view',
    loadComponent: () => import('./waste/waste-view/waste-view.component').then((m) => m.WasteViewComponent),
    canActivate: [AuthGuardChild]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule {}

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';

import {FinanceRoutingModule} from './finance-routing.module';
import {ExpensesComponent} from './expenses/expenses.component';
import {BankAccountsComponent} from './bank-accounts/bank-accounts.component';
import {OilCreditComponent} from './oil-credit/oil-credit.component';
import {TransactionsComponent} from './transactions/transactions.component';
import {OilSalesComponent} from './oil-sales/oil-sales.component';
import {WasteComponent} from './waste/waste.component';

@NgModule({
  declarations: [
    // Note: Standalone components should not be declared here
    // They are imported directly in routing or other standalone components
    // FinanceDashboardComponent is lazy-loaded in routing
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    FinanceRoutingModule,
    // Import standalone components here for this module
    ExpensesComponent,
    BankAccountsComponent,
    OilCreditComponent,
    TransactionsComponent,
    OilSalesComponent,
    WasteComponent,
  ]
})
export class FinanceModule {}

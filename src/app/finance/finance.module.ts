import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';

import {FinanceRoutingModule} from './finance-routing.module';
import {PricingComponent} from './pricing/pricing.component';
import {OilCreditComponent} from './oil-credit/oil-credit.component';
import {TransactionsComponent} from './transactions/transactions.component';
import {CustomersComponent} from './customers/customers.component';
import {WasteComponent} from './waste/waste.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    FinanceRoutingModule,
    OilCreditComponent,
    PricingComponent,
    TransactionsComponent,
    CustomersComponent,
    WasteComponent,
  ]
})
export class FinanceModule {}

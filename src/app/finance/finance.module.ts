import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { FinanceRoutingModule } from './finance-routing.module';
import { PricingComponent } from './pricing/pricing.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    FinanceRoutingModule,
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PricingComponent
  ]
})
export class FinanceModule {}

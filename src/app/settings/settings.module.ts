import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GeneralConfigComponent } from './general-config/general-config.component';
  import { PricingComponent } from './pricing/pricing.component';
import { StorageUnitsComponent } from './storage/storage.component';
import { GenericTypeComponent } from './generic-type/generic-type.component';
import { QualityControlRuleComponent } from './quality-control-rule/quality-control-rule.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    StorageUnitsComponent,
    GeneralConfigComponent,
    QualityControlRuleComponent,
    PricingComponent,GenericTypeComponent
  ]
})
export class SettingsModule {}

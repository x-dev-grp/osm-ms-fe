import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModule } from '../shared/shared.module';

import { GeneralConfigComponent } from './general-config/general-config.component';
 import { GenericTypeComponent } from './generic-type/generic-type.component';
import { QualityControlRuleComponent } from './quality-control-rule/quality-control-rule.component';
import { ApplicationConfigComponent } from './application-config/application-config.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    SharedModule,
     GeneralConfigComponent,
    QualityControlRuleComponent,

    GenericTypeComponent,
    ApplicationConfigComponent
  ]
})
export class SettingsModule {}

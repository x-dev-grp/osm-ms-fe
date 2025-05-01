import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralConfigComponent } from './general-config/general-config.component';
  import { PricingComponent } from './pricing/pricing.component';
import { StorageUnitsComponent } from './storage/storage.component';
import { GenericTypeComponent } from './generic-type/generic-type.component';
import { QualityControlRuleComponent } from './quality-control-rule/quality-control-rule.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';

const routes: Routes = [
  { path: 'general-config', component: GeneralConfigComponent },
  { path: 'quality-control', component: QualityControlRuleComponent },
  { path: 'storage', component: StorageUnitsComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'banks', component: BankAccountsComponent },

  { path: 'generic', component: GenericTypeComponent },
 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeneralConfigComponent } from './general-config/general-config.component';
 import { StorageUnitsComponent } from './storage/storage.component';
import { GenericTypeComponent } from './generic-type/generic-type.component';
import { QualityControlRuleComponent } from './quality-control-rule/quality-control-rule.component';
import { ApplicationConfigComponent } from './application-config/application-config.component';

const routes: Routes = [
  { path: 'general-config', component: GeneralConfigComponent },
  { path: 'quality-control', component: QualityControlRuleComponent },
  { path: 'storage', component: StorageUnitsComponent },
  { path: 'configuration', component: ApplicationConfigComponent },

  { path: 'generic', component: GenericTypeComponent },
 ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}

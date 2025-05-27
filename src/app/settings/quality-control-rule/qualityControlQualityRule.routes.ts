import {Routes} from "@angular/router";
import {QualityControlRuleComponent} from "./quality-control-rule.component";
import {QualityControlRuleAddComponent} from "./quality-control-rule-add/quality-control-rule-add.component";

export const qualityControlRoutes: Routes = [
  {
    path: '',
    component: QualityControlRuleComponent,
  },

  {
    path: ':id',
    component: QualityControlRuleAddComponent,
  },
];


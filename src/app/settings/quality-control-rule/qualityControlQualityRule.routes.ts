import { Routes } from '@angular/router';
import { QualityControlRuleComponent } from './quality-control-rule.component';
import { QualityControlRuleAddComponent } from './quality-control-rule-add/quality-control-rule-add.component';
import { allPermissionGuard } from 'src/app/interceptors/guards/permission.guard';
import { Action, OOSMModule, permissionKey, ProductionEntity } from 'src/app/theme/types/permissions';

const rulePermission = (action: Action) => permissionKey(OOSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRULE, action);

export const qualityControlRoutes: Routes = [
  {
    path: '',
    component: QualityControlRuleComponent,
    canActivate: [allPermissionGuard([rulePermission(Action.READ)])]
  },
  {
    path: 'new',
    component: QualityControlRuleAddComponent,
    canActivate: [allPermissionGuard([rulePermission(Action.CREATE)])]
  },
  {
    path: ':id',
    component: QualityControlRuleAddComponent,
    canActivate: [allPermissionGuard([rulePermission(Action.UPDATE)])]
  }
];

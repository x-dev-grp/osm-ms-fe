import { inject, Injectable } from '@angular/core';
import { AuthenticationService } from '../auth/services/authentication.service';
import {
  Action,
  ConditioningEntity,
  FinanceEntity,
  HREntity,
  InventoryEntity,
  OOSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity
} from '../theme/types/permissions';
import {
  DASHBOARD_TAB_ORDER,
  DASHBOARD_TAB_REGISTRY,
  DashboardTabDefinition,
  DashboardTabId
} from './dashboard-hub.models';

@Injectable({ providedIn: 'root' })
export class DashboardHubService {
  private readonly auth = inject(AuthenticationService);

  getVisibleTabs(): DashboardTabDefinition[] {
    const byId = new Map(DASHBOARD_TAB_REGISTRY.map((tab) => [tab.id, tab]));
    return DASHBOARD_TAB_ORDER.map((id) => byId.get(id)).filter(
      (tab): tab is DashboardTabDefinition => !!tab && this.canViewTab(tab.id)
    );
  }

  canViewTab(tabId: DashboardTabId): boolean {
    return this.canViewTabForUser(tabId);
  }

  isKnownTab(tabId: string | null | undefined): tabId is DashboardTabId {
    return !!tabId && DASHBOARD_TAB_ORDER.includes(tabId as DashboardTabId);
  }

  private canViewTabForUser(tabId: DashboardTabId): boolean {
    switch (tabId) {
      case 'overview':
        return true;

      case 'reception':
        return (
          this.auth.hasModule(OOSMModule.RECEPTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
        );

      case 'finance':
        return (
          this.auth.hasModule(OOSMModule.FINANCE) &&
          this.auth.hasPermission(permissionKey(OOSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ))
        );

      case 'storage':
        return (
          this.auth.hasModule(OOSMModule.PRODUCTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ))
        );

      case 'inventory':
        return (
          this.auth.hasModule(OOSMModule.INVENTAIR) &&
          this.auth.hasPermission(permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
        );

      case 'hr':
        return (
          this.auth.hasModule(OOSMModule.HR) &&
          this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ))
        );

      case 'analytics':
        return (
          this.auth.hasModule(OOSMModule.CONDITIONING) &&
          this.auth.hasPermission(permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.ANALYTICS, Action.READ))
        );

      case 'administration':
        return this.auth.isOosmAdmin();

      default:
        return false;
    }
  }
}

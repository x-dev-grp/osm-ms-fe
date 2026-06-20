import { Routes } from '@angular/router';
import { SupplierComponent } from './suppliers/suppliers.component';
import { SupplierAddComponent } from './suppliers/supplier-add/supplier-add.component';
import { SupplierDetailsComponent } from './suppliers/supplier-details/supplier-details.component';
import { DetailsReceptionComponent } from './details-reception/details-reception.component';
import { ControleQualiteComponent } from './controleQualite/controleQualite.component';
import { PlanningComponent } from './planning/planning.component';
import { MillMachineComponent } from './mill-machine/mill-machine.component';
import { OliveReceptionComponent } from './olive-reception/olive-reception.component';
import { OliveReceptionFormComponent } from './olive-reception/olive-reception-add/olive-reception-form.component';
import { OilReceptionFormComponent } from './oil-reception/oil-reception-add/oil-reception-add.component';
import { OilReceptionComponent } from './oil-reception/oil-reception.component';
import { MillMachineAddComponent } from './mill-machine/mill-machine-add/mill-machine-add.component';
import { MillMachineViewComponent } from './mill-machine/mill-machine-view/mill-machine-view.component';
import { MillMachineMaintenanceRedirectComponent } from './mill-machine/mill-machine-maintenance-redirect.component';
import { OilQCComponent } from './oil-qc/oilQC.component';
import { ReceptionListComponent } from './reception-list/reception-list.component';
import { ReceptionDashboardComponent } from './reception-dashboard/reception-dashboard.component';
import { SupplierPaymentHistoryComponent } from './suppliers/supplier-payment-history/supplier-payment-history.component';
import { allPermissionGuard, anyPermissionGuard, moduleGuard } from '../interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { Action, OSMModule, permissionKey, ProductionEntity, ReceptionEntity } from 'src/app/theme/types/permissions';
import { OliveQCComponent } from './olive-qc/oliveQC.component';
import { OperationType } from '../shared/models/operation-type.enum';
import { SupplierInfoComponent } from './suppliers/supplier-info/supplier-info.component';

export const receptionRoutes: Routes = [
  // DASHBOARD (READ)
  {
    path: '',
    component: ReceptionDashboardComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },
  {
    path: 'dashboard',
    component: ReceptionDashboardComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },
  {
    path: 'reception-dashboard',
    component: ReceptionDashboardComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },

  /**
   * OLIVE RECEPTION (CREATE) — operation type is forced from route
   * Clean URLs with static data.op (recommended)
   */
  {
    path: 'reception-olive/exchange',
    component: OliveReceptionComponent,
    data: { op: 'EXCHANGE' },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },
  {
    path: 'reception-olive/simple_reception',
    component: OliveReceptionComponent,
    data: { op: 'SIMPLE_RECEPTION' },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },
  {
    path: 'reception-olive/base',
    component: OliveReceptionComponent,
    data: { op: 'BASE' },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },
  {
    path: 'reception-olive/olive_purchase',
    component: OliveReceptionComponent,
    data: { op: 'OLIVE_PURCHASE' },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },

  // Optional generic fallback: /reception-olive/:op  (EXCHANGE|SIMPLE_RECEPTION|BASE|OLIVE_PURCHASE)
  {
    path: 'reception-olive/:op',
    component: OliveReceptionComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },

  /**
   * OLIVE RECEPTION (UPDATE) — edit by id, with op in URL for consistent locking
   * Prefer these paths; form will still accept forced type via route data or :op
   */
  {
    path: 'reception-olive/exchange/:id',
    component: OliveReceptionFormComponent,
    data: { op: OperationType.EXCHANGE },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },
  {
    path: 'reception-olive/simple_reception/:id',
    component: OliveReceptionFormComponent,
    data: { op: OperationType.SIMPLE_RECEPTION },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },
  {
    path: 'reception-olive/base/:id',
    component: OliveReceptionFormComponent,
    data: { op: OperationType.BASE },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },
  {
    path: 'reception-olive/olive_purchase/:id',
    component: OliveReceptionFormComponent,
    data: { op: OperationType.OLIVE_PURCHASE },
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },

  // Backward-compatible legacy edit route: /reception-olive/:id (kept, but op won’t be in URL)
  {
    path: 'reception-olive/:id',
    component: OliveReceptionFormComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },

  // OIL RECEPTION (CREATE/UPDATE)
  {
    path: 'reception-huile',
    component: OilReceptionComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },
  {
    path: 'reception-huile/:id',
    component: OilReceptionFormComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },

  // SUPPLIERS
  {
    path: 'fournisseur',
    component: SupplierComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.CREATE)])]
  },
  {
    path: 'fournisseur/new',
    component: SupplierAddComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.CREATE)])]
  },
  {
    path: 'fournisseur/info/:id',
    component: SupplierInfoComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.CREATE)])]
  },
  {
    path: 'fournisseur/details/:id',
    component: SupplierDetailsComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.READ)])]
  },
  {
    path: 'fournisseur/edit/:id',
    component: SupplierAddComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.UPDATE)])]
  },
  {
    path: 'fournisseur/payments/:id',
    component: SupplierPaymentHistoryComponent,
    canActivate: [moduleGuard([OSMModule.FINANCE])]
  },

  // QUALITY CONTROL
  {
    path: 'oil_qc',
    component: OilQCComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRESULT, Action.READ)])]
  },
  {
    path: 'olive_qc',
    component: OliveQCComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRESULT, Action.READ)])]
  },
  {
    path: 'quality/:id',
    component: ControleQualiteComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRESULT, Action.READ)])]
  },
  {
    path: 'quality/oilFromOlive/:idx',
    component: ControleQualiteComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.QUALITYCONTROLRESULT, Action.READ)])]
  },

  // RECEPTION DETAILS (READ)
  {
    path: 'reception-details/:id',
    component: DetailsReceptionComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },

  // PLANNING (PLANNING)
  {
    path: 'mill-schedules',
    component: PlanningComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)])]
  },

  // MILL MACHINES
  {
    path: 'mill-machines',
    component: MillMachineComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.READ)])]
  },
  {
    path: 'mill-machines/new',
    component: MillMachineAddComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.CREATE)])]
  },
  {
    path: 'mill-machines/:id',
    component: MillMachineAddComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.UPDATE)])]
  },
  {
    path: 'mill-machines/view/:id',
    component: MillMachineViewComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.READ)])]
  },
  {
    path: 'mill-machines/maintenance/:id',
    component: MillMachineMaintenanceRedirectComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.MAINTENANCE)])]
  },

  // RECEPTION LIST (READ)
  {
    path: 'reception-list',
    component: ReceptionListComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },
  {
    path: 'reception-list/:deliveryType',
    component: ReceptionListComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },
  {
    path: 'reception-list/:deliveryType/:operationType',
    component: ReceptionListComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  }
];

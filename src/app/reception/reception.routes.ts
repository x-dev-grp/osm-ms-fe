import { Routes } from '@angular/router';
import { SupplierComponent } from './components/suppliers/suppliers.component';
import { SupplierAddComponent } from './components/suppliers/supplier-add/supplier-add.component';
import { SupplierDetailsComponent } from './components/suppliers/supplier-details/supplier-details.component';
import { DetailsReceptionComponent } from './components/details-reception/details-reception.component';
import { ControleQualiteComponent } from './components/controleQualite/controleQualite.component';
import { PlanningComponent } from './components/planning/planning.component';
import { MillMachineComponent } from './components/mill-machine/mill-machine.component';
import { OliveReceptionComponent } from './components/olive-reception/olive-reception.component';
import { OliveReceptionFormComponent } from './components/olive-reception/olive-reception-add/olive-reception-form.component';
import { OilReceptionFormComponent } from './components/oil-reception/oil-reception-add/oil-reception-add.component';
import { OilReceptionComponent } from './components/oil-reception/oil-reception.component';
import { MillMachineAddComponent } from './components/mill-machine/mill-machine-add/mill-machine-add.component';
import { MillMachineViewComponent } from './components/mill-machine/mill-machine-view/mill-machine-view.component';
import { MillMachineMaintenanceComponent } from './components/mill-machine/mill-machine-maintenance/mill-machine-maintenance.component';
import { QualityControlListComponent } from './components/quality-control-list/quality-control-list.component';
import { ReceptionListComponent } from './components/reception-list/reception-list.component';
import { ReceptionDashboardComponent } from './components/reception-dashboard/reception-dashboard.component';
import { SupplierPaymentHistoryComponent } from './components/suppliers/supplier-payment-history/supplier-payment-history.component';
import { allPermissionGuard, anyPermissionGuard, moduleGuard } from '../interceptors/guards/permission.guard';
// CHANGE: permissions - use enums
import { Action, OSMModule, permissionKey, ProductionEntity, ReceptionEntity } from 'src/app/theme/types/permissions';

export const receptionRoutes: Routes = [
  // CHANGE: permissions - dashboard requires RECEPTION:UNIFIEDDELIVERY:READ
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

  // CHANGE: permissions - olive reception requires RECEPTION:UNIFIEDDELIVERY:CREATE
  {
    path: 'reception-olive',
    component: OliveReceptionComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE)])]
  },
  {
    path: 'reception-olive/:id',
    component: OliveReceptionFormComponent,
    canActivate: [anyPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.UPDATE)])]
  },

  // CHANGE: permissions - oil reception requires RECEPTION:UNIFIEDDELIVERY:CREATE
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

  // CHANGE: permissions - suppliers require RECEPTION:SUPPLIER:READ
  {
    path: 'fournisseur',
    component: SupplierComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.SUPPLIER, Action.READ)])]
  },
  {
    path: 'fournisseur/new',
    component: SupplierAddComponent,
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

  // CHANGE: permissions - quality control requires PRODUCTION:QUALITYCONTROLRESULT:READ
  {
    path: 'quality',
    component: QualityControlListComponent,
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
  }, // CHANGE: permissions - reception details require RECEPTION:UNIFIEDDELIVERY:READ
  {
    path: 'reception-details/:id',
    component: DetailsReceptionComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  },

  // CHANGE: permissions - planning requires RECEPTION:UNIFIEDDELIVERY:PLANNING
  {
    path: 'mill-schedules',
    component: PlanningComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.PLANNING)])]
  }, // CHANGE: permissions - mill machines require PRODUCTION:MILLMACHINE:READ
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
    component: MillMachineMaintenanceComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.PRODUCTION, ProductionEntity.MILLMACHINE, Action.MAINTENANCE)])]
  }, // CHANGE: permissions - reception list requires RECEPTION:UNIFIEDDELIVERY:READ
  {
    path: 'reception-list',
    component: ReceptionListComponent,
    canActivate: [allPermissionGuard([permissionKey(OSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ)])]
  }
];

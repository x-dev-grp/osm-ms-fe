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
import {
  SupplierPaymentHistoryComponent
} from './components/suppliers/supplier-payment-history/supplier-payment-history.component';
import { allPermissionGuard } from '../interceptors/guards/permission.guard';

export const receptionRoutes: Routes = [
  { path: '', component: ReceptionDashboardComponent },
  { path: 'dashboard', component: ReceptionDashboardComponent },
  { path: 'reception-dashboard', component: ReceptionDashboardComponent },
  { path: 'reception-olive', component: OliveReceptionComponent },
  { path: 'reception-olive/:id', component: OliveReceptionFormComponent },

  { path: 'reception-huile', component: OilReceptionComponent },
  { path: 'reception-huile/:id', component: OilReceptionFormComponent },

  { path: 'fournisseur', component: SupplierComponent },
  { path: 'fournisseur/new', component: SupplierAddComponent },
  { path: 'fournisseur/details/:id', component: SupplierDetailsComponent },
  { path: 'fournisseur/edit/:id', component: SupplierAddComponent },
  { path: 'fournisseur/payments/:id', component: SupplierPaymentHistoryComponent },

  { path: 'quality', component: QualityControlListComponent ,   canActivate: [allPermissionGuard(['RECEPTION:RECEPTION:QUALITYCONTROLRESULT'])]
  },
  { path: 'quality/:id', component: ControleQualiteComponent },
  { path: 'quality/oilFromOlive/:idx', component: ControleQualiteComponent },
  { path: 'reception-details/:id', component: DetailsReceptionComponent },

  { path: 'mill-schedules', component: PlanningComponent },
  { path: 'mill-machines', component: MillMachineComponent },
  { path: 'mill-machines/new', component: MillMachineAddComponent },
  { path: 'mill-machines/:id', component: MillMachineAddComponent },
  { path: 'mill-machines/view/:id', component: MillMachineViewComponent },
  { path: 'mill-machines/maintenance/:id', component: MillMachineMaintenanceComponent },
  { path: 'reception-list', component: ReceptionListComponent }
];

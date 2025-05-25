import {Routes} from '@angular/router';
import {SupplierComponent} from './components/suppliers/suppliers.component';
import {DetailsReceptionComponent} from './components/details-reception/details-reception.component';
import {SupplierDetailsComponent} from './components/suppliers/supplier-details/supplier-details.component';
import {ControleQualiteComponent} from './components/controleQualite/controleQualite.component';
import {PlanningComponent} from './components/planning/planning.component';
import {MillMachineComponent} from './components/mill-machine/mill-machine.component';
import {OliveReceptionComponent} from './components/olive-reception/olive-reception.component';
import {
  OliveReceptionFormComponent
} from './components/olive-reception/olive-reception-add/olive-reception-form.component';
import {OilReceptionFormComponent} from './components/oil-reception/oil-reception-add/oil-reception-add.component';
import {OilReceptionComponent} from './components/oil-reception/oil-reception.component';
import {SupplierAddComponent} from './components/suppliers/supplier-add/supplier-add.component';

export const receptionRoutes: Routes = [
  { path: 'reception-olive', component: OliveReceptionComponent },
  { path: 'reception-olive/:id', component: OliveReceptionFormComponent },

  { path: 'reception-huile', component: OilReceptionComponent },
  { path: 'reception-huile/:id', component: OilReceptionFormComponent },

  { path: 'fournisseur', component: SupplierComponent },
  { path: 'fournisseur/new', component: SupplierAddComponent },
  { path: 'fournisseur/:id', component: SupplierAddComponent },
  { path: 'fournisseur/details/:id', component: SupplierDetailsComponent },

  { path: 'quality/:id', component: ControleQualiteComponent },
  { path: 'reception-details/:id', component: DetailsReceptionComponent },

  { path: 'mill-schedules', component: PlanningComponent },
  { path: 'mill-machines', component: MillMachineComponent },
];

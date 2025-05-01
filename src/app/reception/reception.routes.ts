import { Routes } from '@angular/router';
 import { SupplierComponent } from './components/suppliers/suppliers.component';
import { ReceptionComponent } from './components/reception/reception.component';
import {DetailsReceptionComponent} from "./components/details-reception/details-reception.component";
import {SupplierDetailsComponent} from "./components/supplier-details/supplier-details.component";
import { ControleQualiteComponent } from './components/controleQualite/controleQualite.component';
// import {ReceptionComponent} from "./components/reception/reception.component";

export const receptionRoutes: Routes = [
  { path: 'reception', component: ReceptionComponent },
  { path: 'fournisseur', component: SupplierComponent },
  { path: 'quality/:id', component: ControleQualiteComponent },
  { path: 'reception-details/:id', component: DetailsReceptionComponent },
  { path: 'supplier-details/:id', component: SupplierDetailsComponent }


];

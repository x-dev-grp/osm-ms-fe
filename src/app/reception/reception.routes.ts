import { Routes } from '@angular/router';
import { ControleQualiteComponent } from './components/controle-qualite/controle-qualite.component';
import { SupplierComponent } from './components/suppliers/suppliers.component';
import { BonReceptionComponent } from './components/bonReception/bonreception.component';
import { ReceptionComponent } from './components/reception/reception.component';
// import {ReceptionComponent} from "./components/reception/reception.component";

export const receptionRoutes: Routes = [
  { path: 'reception', component: ReceptionComponent },
  { path: 'fournisseur', component: SupplierComponent },
  { path: 'bonreception', component: BonReceptionComponent },
  { path: 'quality', component: ControleQualiteComponent }
];


import { Routes } from '@angular/router';
 import {BonReceptionComponent} from "./components/bonReception/reception.component";
import { ControleQualiteComponent } from './components/controle-qualite/controle-qualite.component';
 import { SupplierComponent } from './components/suppliers/suppliers.component';
// import {ReceptionComponent} from "./components/reception/reception.component";



export const receptionRoutes: Routes = [
  { path: '', component: SupplierComponent},
  { path: 'fournisseur', component: SupplierComponent },
  { path: 'bonreception', component: BonReceptionComponent },
  { path: 'quality', component: ControleQualiteComponent },


];

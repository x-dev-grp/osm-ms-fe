
import { Routes } from '@angular/router';
import {FournisseursComponent} from "./components/fournisseurs/fournisseurs.component";
import {BonReceptionComponent} from "./components/bonReception/reception.component";
import {ReceptionComponent} from "./components/reception/reception.component";



export const receptionRoutes: Routes = [
  { path: '', component: ReceptionComponent},
  { path: 'fournisseur', component: FournisseursComponent },
  { path: 'bonreception', component: BonReceptionComponent },


];

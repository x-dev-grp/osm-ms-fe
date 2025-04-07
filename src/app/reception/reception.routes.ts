
import { Routes } from '@angular/router';
import {FournisseursComponent} from "./components/fournisseurs/fournisseurs.component";
import {BonReceptionComponent} from "./components/bonReception/reception.component";
import {ReceptionComponent} from "./components/reception/reception.component";
import {ReceptionOliveComponent} from "./components/reception-olive/reception-olive.component";
import {ReceptionhuileComponent} from "./components/receptionhuile/receptionhuile.component";


export const receptionRoutes: Routes = [
  { path: '', component: ReceptionComponent},
  { path: 'fournisseur', component: FournisseursComponent },
  { path: 'bonreception', component: BonReceptionComponent },
  { path: 'receptionolive', component: ReceptionOliveComponent },
  { path: 'receptionhuile', component: ReceptionhuileComponent }

];

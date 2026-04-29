import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientListComponent } from './pages/clients/client-list/client-list.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ClientDetailComponent } from './pages/clients/client-detail/client-detail.component';
import { ProjetListComponent } from './pages/projets/projet-list/projet-list.component';
import { ProjetFormComponent } from './pages/projets/projet-form/projet-form.component';
import {ProjetDetailComponent} from "./pages/projets/projet-detail/projet-detail.component";
import { ProjetShippingComponent } from './pages/projets/projet-shipping/projet-shipping.component';
import { ProjetExpeditionComponent } from './pages/projets/projet-expedition/projet-expedition.component';


const routes: Routes = [
  { path: '', component: ProjetListComponent },
  { path: 'new', component: ProjetFormComponent },

  { path: 'clients', component: ClientListComponent },
  { path: 'clients/new', component: ClientFormComponent },
  { path: 'clients/detail/:id', component: ClientDetailComponent },
  { path: 'clients/:id', component: ClientFormComponent },

  // Keep specific project routes above dynamic ':id'
  { path: 'detail/:id/expedition', component: ProjetExpeditionComponent },
  { path: 'detail/:id/shipping', component: ProjetShippingComponent },
  { path: 'detail/:id', component: ProjetDetailComponent },
  { path: ':id', component: ProjetFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjetRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProjetRoutingModule } from './projet-routing.module';

// Composants
import { ClientListComponent } from './pages/clients/client-list/client-list.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ClientDetailComponent } from './pages/clients/client-detail/client-detail.component';
import { ProjetListComponent } from './pages/projets/projet-list/projet-list.component';
import { ProjetFormComponent } from './pages/projets/projet-form/projet-form.component';
import { ProjetShippingComponent } from './pages/projets/projet-shipping/projet-shipping.component';

@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProjetRoutingModule,
    ClientListComponent,
    ClientFormComponent,
    ClientDetailComponent,
    ProjetListComponent,
    ProjetFormComponent,
    ProjetShippingComponent
  ]
})
export class ProjetModule { }

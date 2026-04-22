import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProjetRoutingModule } from './projet-routing.module';

// Composants
import { ClientListComponent } from './pages/clients/client-list/client-list.component';
import { ClientFormComponent } from './pages/clients/client-form/client-form.component';
import { ProjetListComponent } from './pages/projets/projet-list/projet-list.component';
import { ProjetFormComponent } from './pages/projets/projet-form/projet-form.component';

@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProjetRoutingModule,
    ClientListComponent,
    ClientFormComponent,
    ProjetListComponent,
    ProjetFormComponent
  ]
})
export class ProjetModule { }

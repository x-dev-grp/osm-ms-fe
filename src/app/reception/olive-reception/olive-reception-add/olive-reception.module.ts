import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectFilterModule } from 'mat-select-filter';
import { OliveReceptionFormComponent } from './olive-reception-form.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatSelectFilterModule
  ],
  exports: [
    MatSelectFilterModule
  ]
})
export class OliveReceptionModule { }

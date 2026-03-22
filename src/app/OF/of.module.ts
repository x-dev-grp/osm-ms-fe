import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfRoutingModule } from './of-routing.module';
import {OFListComponent} from "./components/of/of-list/of-list.component";
import {OFFormComponent} from "./components/of/of-form/of-form.component";
import {OFDetailComponent} from "./components/of/of-detail/of-detail.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    OfRoutingModule,
    OFListComponent,
    OFFormComponent,
    OFDetailComponent
  ]
})
export class OfModule { }

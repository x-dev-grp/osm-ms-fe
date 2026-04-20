import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfRoutingModule } from './of-routing.module';
import {OFListComponent} from "./components/of/of-list/of-list.component";
import {OFFormComponent} from "./components/of/of-form/of-form.component";
import {OFDetailComponent} from "./components/of/of-detail/of-detail.component";
import {QualityControlEntryComponent} from "./components/QC/quality-control-entry/quality-control-entry.component";
import {QualityHistoryComponent} from "./components/QC/quality-history/quality-history.component";
import {
  ControlPointDefinitionComponent
} from "./components/QC/control-point-definition/control-point-definition.component";


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    OfRoutingModule,
    OFListComponent,
    OFFormComponent,
    OFDetailComponent,
    ControlPointDefinitionComponent,
    QualityControlEntryComponent,
    QualityHistoryComponent,

  ]
})
export class OfModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OFListComponent } from './components/of/of-list/of-list.component';
import { OFDetailComponent } from "./components/of/of-detail/of-detail.component";
import { OFFormComponent } from "./components/of/of-form/of-form.component";
import { ControlPointDefinitionComponent } from "./components/QC/control-point-definition/control-point-definition.component";
import { QualityControlEntryComponent } from "./components/QC/quality-control-entry/quality-control-entry.component";
import { QualityHistoryComponent } from "./components/QC/quality-history/quality-history.component";
import { OFProductionComponent } from "./components/of/of-production/of-production.component";

const routes: Routes = [
  { path: '', component: OFListComponent },
  { path: 'nouveau', component: OFFormComponent },
  { path: 'modifier/:id', component: OFFormComponent },
  { path: ':id', component: OFDetailComponent },

  { path: 'production', component: OFProductionComponent },        // ✅ AVANT :id
  { path: 'qualite/points', component: ControlPointDefinitionComponent },
  { path: 'qualite/entry', component: QualityControlEntryComponent },
  { path: 'qualite/history', component: QualityHistoryComponent },
  { path: ':id', component: OFDetailComponent },                    // ✅ :id EN DERNIER
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfRoutingModule { }

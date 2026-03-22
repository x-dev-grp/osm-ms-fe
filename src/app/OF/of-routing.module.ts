import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OFListComponent } from './components/of/of-list/of-list.component';
import {OFDetailComponent} from "./components/of/of-detail/of-detail.component";
import {OFFormComponent} from "./components/of/of-form/of-form.component";

const routes: Routes = [
  { path: '', component: OFListComponent },
  { path: 'nouveau', component: OFFormComponent },
  { path: ':id', component: OFDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OfRoutingModule { }

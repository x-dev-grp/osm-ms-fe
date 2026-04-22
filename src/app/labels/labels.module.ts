import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LabelWorkflowComponent } from './components/label-workflow/label-workflow.component';

const routes: Routes = [
  { path: '', component: LabelWorkflowComponent },
  { path: ':id', component: LabelWorkflowComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LabelWorkflowComponent  // composant standalone
  ]
})
export class LabelsModule { }

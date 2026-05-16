import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LabelListComponent } from './components/label-list/label-list.component';
import { LabelDetailComponent } from './components/label-detail/label-detail.component';
import { LabelWorkflowComponent } from './components/label-workflow/label-workflow.component';
import { CertificationListComponent } from './components/certification-list/certification-list.component';
import { CertificationDetailComponent } from './components/certification-detail/certification-detail.component';

const routes: Routes = [
  { path: '', component: LabelListComponent },

  { path: 'certifications', component: CertificationListComponent },
  { path: 'certifications/:id', component: CertificationDetailComponent },

  { path: 'new', component: LabelWorkflowComponent },
  { path: ':id/edit', component: LabelWorkflowComponent },

  // DÉTAIL ÉTIQUETTE
  { path: ':id', component: LabelDetailComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LabelListComponent,
    LabelDetailComponent,
    LabelWorkflowComponent,
    CertificationListComponent,
    CertificationDetailComponent
  ]
})
export class LabelsModule {}

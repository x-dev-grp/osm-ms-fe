import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OfYieldReportComponent } from './components/Rendement-OF/Rendement-OF.component';
import { RapportGlobalOFComponent } from './components/Rapport-Global-OF/Rapport-Global-OF.component';
import { RapportBomComponent } from './components/Rapport-bom/rapport-bom.component';
import { RapportFiltrationComponent } from './components/Rapport-Filtration/Rapport-Filtration.component';
import { RapportQualiteComponent } from './components/Rapport-Qualite/Rapport-Qualite.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'global-of',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: RapportGlobalOFComponent
  },
  {
    path: 'global-of',
    component: RapportGlobalOFComponent
  },
  {
    path: 'of-yield',
    component: OfYieldReportComponent
  },
  {
    path: 'rendement-of',
    component: OfYieldReportComponent
  },
  {
    path: 'bom',
    component: RapportBomComponent
  },
  {
    path: 'bom-gap',
    component: RapportBomComponent
  },
  {
    path: 'filtration',
    component: RapportFiltrationComponent
  },
  {
    path: 'quality',
    component: RapportQualiteComponent
  },
  {
    path: 'qualite',
    component: RapportQualiteComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule {}

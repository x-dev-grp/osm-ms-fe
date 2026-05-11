import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnalyticsRoutingModule } from './analytics-routing.module';

import { RapportBomComponent } from './components/Rapport-bom/rapport-bom.component';
import { RapportFiltrationComponent } from './components/Rapport-Filtration/Rapport-Filtration.component';
import { RapportGlobalOFComponent } from './components/Rapport-Global-OF/Rapport-Global-OF.component';
import { RapportQualiteComponent } from './components/Rapport-Qualite/Rapport-Qualite.component';
import { OfYieldReportComponent } from './components/Rendement-OF/Rendement-OF.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AnalyticsRoutingModule,

    RapportBomComponent,
    RapportFiltrationComponent,
    RapportGlobalOFComponent,
    RapportQualiteComponent,
    OfYieldReportComponent
  ]
})
export class AnalyticsModule {}

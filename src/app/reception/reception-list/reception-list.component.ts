import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {OsmDashboard} from '../../shared/modules/osm-dashboard/osm-dashboard';
import {LIST_RECEPTION_DASHBOARD} from './LIST_RECEPTION_DASHBOARD';
import {UnifiedDelivery} from '../../shared/models/UnifiedDelivery';
import {UnifiedDeliveryService} from '../../shared/services/delivery.service';
import {tap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {PdfGeneratorService} from '../../shared/services/pdf-generator.service';
import {ToastService} from '../../shared/services/toast.service';
import {getControlQualitePdfConfig} from '../pdf-config/controlQualite.config';
import {getOlivePdfConfig} from '../pdf-config/reception-olive-pdf.config';
import {getProductionPdfConfig} from '../pdf-config/production-pdf.config';
import {getOilPdfConfig} from '../pdf-config/reception-oil-pdf.config';


// Import the new unified PDF services
// import { PdfConfigFactoryService } from '../../shared/services/pdf-config-factory.service';
// import { UnifiedPdfGeneratorService } from '../../shared/services/unified-pdf-generator.service';

@Component({
  selector: 'app-reception-list',
  standalone: true,
  imports: [CommonModule, OsmDashboard],
  templateUrl: './reception-list.component.html'
})
export class ReceptionListComponent implements OnInit {
  dashboardConfig = LIST_RECEPTION_DASHBOARD;

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private _router: Router,
    private toast: ToastService,
    private pdfGeneratorService: PdfGeneratorService,
    private route: ActivatedRoute


    // Inject the new services
    // private pdfConfigFactory: PdfConfigFactoryService,
    // private unifiedPdfGenerator: UnifiedPdfGeneratorService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const deliveryType = (params.get('deliveryType') || '').toLowerCase();
      const operationType = (params.get('operationType') || '').toUpperCase();

      if (deliveryType === 'olive' || deliveryType === 'oil') {
        this.initDashboardConfig(deliveryType.toUpperCase(), operationType || undefined);
      } else {
        this.dashboardConfig = LIST_RECEPTION_DASHBOARD;
      }
    });
  }


  private initDashboardConfig(deliveryType: string, operationType?: string): void {
    const config = JSON.parse(JSON.stringify(LIST_RECEPTION_DASHBOARD));

    // Filtres
    config.defaultSearchData.searchData.search.deliveryType = {equalValue: deliveryType};
    if (operationType) {
      config.defaultSearchData.searchData.search.operationType = {equalValue: operationType};
    }

    // Titre dynamique via traduction existante
    let translateKey = '';

    if (deliveryType === 'OIL') {
      translateKey = 'MENU.RECEPTION.OIL';
    } else if (deliveryType === 'OLIVE') {
      if (!operationType) {
        translateKey = 'MENU.PRODUCTION.MILLING_HISTORY';
      } else {
        const keyMap: Record<string, string> = {
          SIMPLE_RECEPTION: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION',
          BASE: 'DELIVERIES.OPERATION_TYPE.BASE',
          OLIVE_PURCHASE: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE',
          EXCHANGE: 'DELIVERIES.OPERATION_TYPE.EXCHANGE'
        };
        translateKey = keyMap[operationType] || 'MENU.PRODUCTION.MILLING_HISTORY';
      }
    }

    config.titleTranslatePath = translateKey;
    delete config.title; // Optionnel, pour éviter conflit

    this.dashboardConfig = config;
  }



  handleDashboardAction(event: { row: UnifiedDelivery; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.viewDelivery(event.row);
        break;

      case 'UPDATE':
        // this.selectReception(event.row);
        break;

      case 'GEN_PDF':
        this.generateBonReception(event.row);
        break;

      case 'GEN_PDF_QC_OIL':
        if (event.row.qualityControlResults && event.row.qualityControlResults.length > 0) {
          const config = getControlQualitePdfConfig(event.row, 'OIL');
          this.pdfGeneratorService.generatePdf(config);
        } else {
          this.toast.error('AUTO.NO_QUALITY_CONTROL_FOR_OIL');
        }
        break;

      case 'GEN_PDF_QC_OLIVE':
        if (event.row.qualityControlResults && event.row.qualityControlResults.length > 0) {
          const config = getControlQualitePdfConfig(event.row, 'OLIVE');
          this.pdfGeneratorService.generatePdf(config);
          this.toast.success('AUTO.OILRECEPTION_GENERATING_QUALITY_CONTROL_PDF_FOR_DELIVERY', { value0: event.row.lotNumber });
        } else {
          this.toast.error('AUTO.NO_QUALITY_CONTROL_FOR_OLIVE');
        }
        break;

      case 'GEN_PDF_PRODUCTION':
        this.generateBonProduction(event.row);
        break;

      // Example of using the new unified PDF system
      case 'GEN_PDF_UNIFIED':
        this.generateUnifiedPdf(event.row);
        break;

      case 'OIL_QUALITY':
        if (event.row?.id) {
          this._router.navigate(['/reception/quality/oilFromOlive', event.row.id]);
        }
        break;
    }
  }

  generateBonReception(delivery: UnifiedDelivery): void {
    let config;
    if (delivery.deliveryType === 'OLIVE') {
      config = getOlivePdfConfig(delivery);
    } else {
      config = getOilPdfConfig(delivery);
      config = { ...config, layout: 'oilReceptionForm' };
    }

    this.pdfGeneratorService.generatePdf(config);
  }

  generateBonProduction(delivery: UnifiedDelivery): void {
    const parameters = JSON.parse(localStorage.getItem('osm_app_parameters') || '{}');
    const config = getProductionPdfConfig(delivery, parameters);
    this.pdfGeneratorService.generatePdf(config);
  }

  // Example of using the new unified PDF system
  generateUnifiedPdf(delivery: UnifiedDelivery): void {
    try {
      // Using the factory to create a unified config
      // Note: You would need to determine the correct source type for your use case
      // const unifiedConfig = this.pdfConfigFactory.buildUnified(delivery, InvoiceSource.DELIVERY_inv);

      // For demonstration, we'll create a simple config directly
      const config = getOlivePdfConfig(delivery);

      // Convert the existing config to unified format
      // In a real implementation, you would use the factory method above
      // this.unifiedPdfGenerator.generatePdf(unifiedConfig);

      // For now, we'll just show a toast message to indicate the feature is available
      this.toast.success('AUTO.UNIFIED_PDF_GENERATION_FEATURE_IS_READY_FOR_IMPLEMENTATION');
    } catch (error) {
      this.toast.error('AUTO.ERROR_GENERATING_UNIFIED_PDF', { value0: error });
    }
  }

  viewDelivery(row: UnifiedDelivery): void {
    if (row && row.id) {
      this._router.navigate(['/reception/reception-details', row.id]);
      console.log(row);
    }
  }

  private createOilReception(row: UnifiedDelivery) {
    this.deliveryService
      .createOilDeliveryFromOlive(row?.id)
      .pipe(
        tap((response: any) => {
          console.log(response);
          this._router.navigate(['/reception/quality', response?.data]);
        })
      )
      .subscribe();
  }
}

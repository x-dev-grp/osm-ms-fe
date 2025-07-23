import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';
import { SupplierType } from '../../../../shared/models/supplier-type';
import { TranslateModule } from '@ngx-translate/core';
import { deliveryType } from '../../../../shared/models/deleveryType';
import { OilCreditService } from '../../../../finance/service/oil-credit.service';
import { OilCredit } from '../../../../finance/models/OilCredit';
import { CardComponent } from '../../../../@theme/components/card/card.component';

@Component({
  selector: 'app-supplier-details',
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, OsmDashboard, TranslateModule, CardComponent]
})
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  supplierData: SupplierType | null = null;
  loading: boolean = false;
  error: string | null = null;
  paidCount: number = 0;
  unpaidCount: number = 0;
  dashboardConfig: DashboardConfig;
  supplierId: string | null = null;
  private destroy$ = new Subject<void>();
  oilCreditStats = {
    total: 0,
    totalL: 0,
    totalKG: 0,
    stateCounts: {} as { [key: string]: number }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supplierService: SupplierTypeService,
    private location: Location,
    private oilCreditService: OilCreditService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');

    if (this.supplierId) {
      this.setupConfig(this.supplierId);
      this.loadPaymentCounts(this.supplierId);
      this.loadOilCreditStats(this.supplierId);
    } else {
      this.error = 'No supplier ID found';
      this.router.navigate(['/reception/fournisseur']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBack(): void {
    this.router.navigate(['/reception/fournisseur']);
  }

  navigateToHistory(type: 'paid' | 'unpaid' | 'oil_credit'): void {
    if (this.supplierId) {
      this.router.navigate(['/reception/fournisseur/payments', this.supplierId], {
        queryParams: { type }
      });
    }
  }

  handleAction(event: { row: SupplierType; action: string }): void {
    const { action } = event;
    switch (action) {
      default:
        console.warn('Unknown action:', action);
    }
  }

  private setupConfig(supplierId: string) {
    this.dashboardConfig = {
      title: 'Détails du Fournisseur',
      titleTranslatePath: 'SUPPLIERS.DETAILS.TITLE',
      baseURL: 'production/deliveries',
      searchEndpoint: 'production/deliveries',
      addNewItem: false,
      defaultSearchData: {
        page: 0,
        size: 10,
        sort: 'createdDate',
        order: 'DESC',
        searchData: {
          operation: SearchOperation.AND,
          searchs: [
            {
              search: {
                'supplier.id': {
                  equalValue: supplierId
                }
              }
            }
          ]
        }
      },
      fields: [
        {
          name: 'deliveryNumber',
          label: 'N° Bon de réception',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          sortable: true,
          dataTable: false,
          filterable: true
        },
        {
          name: 'lotNumber',
          label: 'N° Lot',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true
        },
        {
          name: 'deliveryType',
          label: 'Type de livraison',
          attributeType: AttributeType.enum,
          fieldType: FieldType.select,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true,
          defaultFilter: true,
          options: [
            { label: 'Olive', value: deliveryType.OLIVE },
            { label: 'Huile', value: deliveryType.OIL }
          ]
        },
        {
          name: 'globalLotNumber',
          label: 'N° Lot Global',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true
        },
        {
          name: 'deliveryDate',
          label: 'Date de réception',
          attributeType: AttributeType.date,
          fieldType: FieldType.date,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true
        },
        {
          name: 'supplier.supplierInfo',
          label: 'Fournisseur',
          attributeType: AttributeType.object,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: true,
          filterable: true,
          valuePath: 'name',
          valueAttributeType: AttributeType.string
        },
        {
          name: 'region',
          label: 'Région',
          attributeType: AttributeType.object,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: true,
          filterable: true,
          valuePath: 'name',
          valueAttributeType: AttributeType.string
        },
        {
          name: 'poidsNet',
          label: 'Poids net (kg)',
          attributeType: AttributeType.number,
          fieldType: FieldType.number,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true
        },
        {
          name: 'oilType',
          label: "Type d'huile",
          attributeType: AttributeType.object,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: true,
          filterable: true,
          valuePath: 'name',
          valueAttributeType: AttributeType.string
        },
        {
          name: 'oliveType',
          label: "Type d'olive",
          attributeType: AttributeType.object,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: false,
          filterable: true,
          valuePath: 'name',
          valueAttributeType: AttributeType.string
        },
        {
          name: 'operationType',
          label: 'Type de trituration',
          labelTranslatePath: 'DELIVERIES.FIELDS.OPERATION_TYPE',
          attributeType: AttributeType.string,
          fieldType: FieldType.select,
          exportable: true,
          dataTable: true,
          filterable: true,
          options: [
            { label: 'Trituration particulier', value: 'SIMPLE_RECEPTION', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION' },
            { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
            { label: 'Achat Olive', value: 'OLIVE_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE' },
            { label: 'Achat Huile', value: 'OIL_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' },
            { label: 'Echange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
            { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' }
          ]
        },
        {
          name: 'matriculeCamion',
          label: 'Matricule camion',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: false,
          filterable: true
        },
        {
          name: 'status',
          label: 'Statut',
          attributeType: AttributeType.string,
          fieldType: FieldType.select,
          exportable: true,
          sortable: true,
          dataTable: true,
          filterable: true,
          options: [
            { label: 'Nouveau', value: 'NEW' },
            { label: 'En cours', value: 'IN_PROGRESS' },
            {
              label: 'Terminé',
              value: 'COMPLETED'
            },
            { label: 'Refusé', value: 'REFUSED' },
            { label: 'Annulé', value: 'CANCELLED' }
          ]
        }
      ],
      fileName: 'supplier-details'
    };
  }

  private loadPaymentCounts(supplierId: string): void {
    if (!supplierId) return;

    // Load paid payments count
    this.supplierService
      .getPaidPaymentsCount(supplierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count: number) => {
          this.paidCount = count;
        },
        error: (error: Error) => {
          console.error('Error loading paid payments:', error);
        }
      });

    // Load unpaid payments count
    this.supplierService
      .getUnpaidPaymentsCount(supplierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count: number) => {
          this.unpaidCount = count;
        },
        error: (error: Error) => {
          console.error('Error loading unpaid payments:', error);
        }
      });
  }

  loadOilCreditStats(supplierId: string): void {
    this.oilCreditService.getAllOilCreditList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const credits = response.data.filter((credit: OilCredit) => credit.destinataire && credit.destinataire.id === supplierId);
          this.oilCreditStats.total = credits.length;
          this.oilCreditStats.totalL = credits
            .filter((c: OilCredit) => c.unit === 'KG')
            .reduce((sum: number, c: OilCredit) => sum + (c.quantity || 0), 0);
          this.oilCreditStats.totalKG = credits
            .filter((c: OilCredit) => c.unit === 'KG')
            .reduce((sum: number, c: OilCredit) => sum + (c.quantity || 0), 0);
          this.oilCreditStats.stateCounts = {};
          for (const c of credits) {
            const state = c.creditState || 'UNKNOWN';
            this.oilCreditStats.stateCounts[state] = (this.oilCreditStats.stateCounts[state] || 0) + 1;
          }
        } else {
          this.oilCreditStats = { total: 0, totalL: 0, totalKG: 0, stateCounts: {} };
        }
      },
      error: () => {
        this.oilCreditStats = { total: 0, totalL: 0, totalKG: 0, stateCounts: {} };
      }
    });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { AttributeType, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';
import { ApiResponse } from '../../../../shared/models/api-response';
import { SupplierType } from '../../../../shared/models/supplier-type';

@Component({
  selector: 'app-supplier-details',
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, OsmDashboard]
})
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  supplierData: SupplierType | null = null;
  loading: boolean = false;
  error: string | null = null;
  paidCount: number = 0;
  unpaidCount: number = 0;
  dashboardConfig: DashboardConfig;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private supplierService: SupplierTypeService
  ) {}

  ngOnInit(): void {
    const supplierId = localStorage.getItem('selectedSupplierId');
    if (supplierId) {
      // this.loadPaymentCounts(supplierId);
      this.setupConfig(supplierId);
    } else {
      this.error = 'No supplier ID found';
      this.router.navigate(['/reception/fournisseur']);
    }
  }

  private setupConfig(supplierId: string) {
    this.dashboardConfig = {
      title: 'Détails du Fournisseur',
      titleTranslatePath: 'SUPPLIERS.DETAILS.TITLE',
      baseURL: 'deliveries',
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
          dataTable: true,
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
        },{
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
          attributeType: AttributeType.object,
          fieldType: FieldType.text,
          exportable: true,
          dataTable: true,
          filterable: true,
          valuePath: 'name',
          valueAttributeType: AttributeType.string
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
            { label: 'Terminé', value: 'COMPLETED' },
            { label: 'Refusé', value: 'REFUSED' },
            { label: 'Annulé', value: 'CANCELLED' }
          ]
        }
      ],
      actions: {
        statusMapping: false,
        statusAttributeName: 'status',
        actionsList: [
          { label: 'Consulter', icon: 'visibility', value: 'CONSULTER' },
          { label: 'Modifier', icon: 'edit', value: 'MODIFIER' },
          { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' },
          { label: 'Générer bon de réception', icon: 'picture_as_pdf', value: 'generate_pdf' }
        ]
      },
      fileName: 'supplier-details'
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    localStorage.removeItem('selectedSupplierId');
  }

  onBack(): void {
    this.router.navigate(['/reception/fournisseur']);
  }

  navigateToHistory(type: 'paid' | 'unpaid'): void {
    const supplierId = localStorage.getItem('selectedSupplierId');
    if (supplierId) {
      this.router.navigate(['/reception/fournisseur/payments'], {
        queryParams: { type, id: supplierId }
      });
    }
  }

  handleAction(event: { row: SupplierType; action: string }): void {
    const { row, action } = event;
    switch (action) {

      default:
        console.warn('Unknown action:', action);
    }
  }



  private loadPaymentCounts(supplierId:string): void {
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
}

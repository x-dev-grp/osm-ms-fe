import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';

import { SharedModule } from '../../demo/shared/shared.module';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { TranslateModule } from '@ngx-translate/core';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { OilTransaction } from '../../shared/models/OilTransaction';

@Component({
  selector: 'app-view-storage',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, SharedModule, TranslateModule, OsmDashboard, RouterOutlet],
  templateUrl: './view-storage.component.html',
  styleUrls: ['./view-storage.component.scss']
})
export class ViewStorageComponent implements OnInit {
  loading = false;
  storageUnit: StorageUnitDto | null = null;
  dashboardConfig: DashboardConfig;
  private storageUnitId: string | null;

  constructor(
    private storageService: StorageUnitDtoService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.storageUnitId = this.route.snapshot.paramMap.get('id');
    this.setupConfig(this.storageUnitId);

    this.loadStorageUnit();
  }

  handleAction(event: { action: string; row: OilTransaction }): void {
    switch (event.action?.toUpperCase()) {
      case 'READ':
        this.router.navigate([`/storage/oil-transaction`, event.row.id]);
        break;
    }
  }

  getFillPercentage(): number {
    if (!this.storageUnit?.maxCapacity || this.storageUnit.maxCapacity <= 0) {
      return 0;
    }
    return (this.storageUnit.currentVolume / this.storageUnit.maxCapacity) * 100;
  }

  getFillLevelClass(): string {
    const percentage = this.getFillPercentage();
    if (percentage >= 90) return 'fill-level-high';
    if (percentage >= 70) return 'fill-level-medium';
    return 'fill-level-low';
  }

  getStatusClass(): string {
    return `status-${this.storageUnit?.status?.toLowerCase()}`;
  }

  getStatusIcon(): string {
    switch (this.storageUnit?.status) {
      case 'AVAILABLE':
        return 'check_circle';
      case 'FULL':
        return 'full';
      case 'FILLING':
        return 'trending_up';
      case 'MAINTENANCE':
        return 'build';
      case 'IN_USE':
        return 'inventory';
      case 'CLEANING':
        return 'cleaning_services';
      case 'RESERVED':
        return 'event_available';
      case 'OUT_OF_SERVICE':
        return 'block';
      default:
        return 'help';
    }
  }

  getStatusIconClass(): string {
    return `status-icon-${this.storageUnit?.status?.toLowerCase()}`;
  }

  private loadStorageUnit(): void {
    this.loading = true;

    if (!this.storageUnitId) {
      this.snackBar.open('Invalid storage unit ID', 'Close', { duration: 3000 });
      this.router.navigate(['/storage']);
      return;
    }

    this.storageService.getStorageUnit(this.storageUnitId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.storageUnit = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.snackBar.open(response.message || 'Error loading storage unit', 'Close', { duration: 3000 });
          this.router.navigate(['/storage']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading storage unit:', error);
        this.snackBar.open('Error loading storage unit', 'Close', { duration: 3000 });
        this.router.navigate(['/storage']);
        this.loading = false;
      }
    });
  }

  private setupConfig(storageUnitId: string | null) {
    this.dashboardConfig = {
      title: 'STORAGE.VIEW.TRANSACTION_HISTORY',
      titleTranslatePath: 'STORAGE.VIEW.TRANSACTION_HISTORY',
      baseURL: 'production/oil_transaction',
      searchEndpoint: 'production/oil_transaction',
      addNewItem: false,
      fileName: 'oil_transactions',
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
                'storageUnitDestination.id': {
                  equalValue: storageUnitId
                }
              }
            }
          ]
        }
      },
      fields: [
        {
          name: 'transactionType',
          label: 'Transaction Type',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.TRANSACTION_TYPE',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          sortable: true,
          exportable: true,
          dataTable: true,
          filterable: true
        },
        {
          name: 'quantityKg',
          label: 'Quantity (kg)',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.QUANTITY_KG',
          attributeType: AttributeType.number,
          fieldType: FieldType.number,
          sortable: true,
          exportable: true,
          dataTable: true
        },
        {
          name: 'unitPrice',
          label: 'Unit Price',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.UNIT_PRICE',
          attributeType: AttributeType.number,
          fieldType: FieldType.number,
          sortable: true,
          exportable: true,
          dataTable: true
        },
        {
          name: 'totalPrice',
          label: 'Total Price',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.TOTAL_PRICE',
          attributeType: AttributeType.number,
          fieldType: FieldType.number,
          sortable: true,
          exportable: true,
          dataTable: true
        },
        {
          name: 'qualityGrade',
          label: 'Quality Grade',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.QUALITY_GRADE',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          sortable: true,
          dataTable: true
        },
        {
          name: 'createdDate',
          label: 'Created Date',
          labelTranslatePath: 'STORAGE.VIEW.DASHBOARD.FIELDS.CREATED_DATE',
          attributeType: AttributeType.string,
          fieldType: FieldType.date,
          exportable: true,
          sortable: true,
          dataTable: true
        }
      ]
    };
  }
}

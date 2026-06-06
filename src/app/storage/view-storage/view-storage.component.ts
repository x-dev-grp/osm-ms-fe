import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { TranslateModule } from '@ngx-translate/core';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { OilTransaction, TransactionType } from '../../shared/models/OilTransaction';
import { ToastService } from '../../shared/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { QrDialogComponent } from '../../shared/components/qr-dialog/qr-dialog.component';
import { ConfirmationDialogService, ConfirmationType } from '../../shared/services/confirmation-dialog.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-view-storage',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    TranslateModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    SharedModule,
    TranslateModule,
    OsmDashboard
  ],
  templateUrl: './view-storage.component.html',
  styleUrls: ['./view-storage.component.scss']
})
export class ViewStorageComponent implements OnInit {
  loading = false;
  generatingQr = false;
  storageUnit: StorageUnitDto | null = null;
  dashboardConfig: DashboardConfig;
  private storageUnitId: string | null;

  constructor(
    private storageService: StorageUnitDtoService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private dialog: MatDialog,
    private confirmationDialog: ConfirmationDialogService
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

  getQrCodeText(): string {
    return this.storageUnit?.publicCode?.trim() || this.storageUnit?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasQrImagePreview(): boolean {
    return !!this.getQrImageSrc();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.getQrImageSrc();
  }

  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata()) return;

    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        qrText: this.getQrCodeText(),
        qrImageBase64: this.storageUnit?.qrImageBase64 || '',
        encrypted: true,
        payloadType: 'STORAGEUNIT',
        payloadMode: 'PUBLIC_CODE'
      }
    });
  }

  getQrImageSrc(): string {
    const value = this.storageUnit?.qrImageBase64?.trim();
    if (!value) return '';
    return value.startsWith('data:image') ? value : `data:image/png;base64,${value}`;
  }

  private loadStorageUnit(): void {
    this.loading = true;

    if (!this.storageUnitId) {
      this.toastService.error('STORAGE.ERROR.INVALID_ID');
      this.router.navigate(['/storage']);
      return;
    }

    this.storageService.getStorageUnit(this.storageUnitId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.storageUnit = Array.isArray(response.data) ? response.data[0] : response.data;

          // Backward/alternate backend field support
          const anyUnit = this.storageUnit as any;
          if (!this.storageUnit.publicCode && anyUnit?.qrHex) {
            this.storageUnit.publicCode = anyUnit.qrHex;
            this.storageUnit.qrHex = anyUnit.qrHex;
          }
        } else {
          this.toastService.error(response.message || 'STORAGE.ERROR.LOAD');
          this.router.navigate(['/storage']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading storage unit:', error);
        this.toastService.error('STORAGE.ERROR.LOAD');
        this.router.navigate(['/storage']);
        this.loading = false;
      }
    });
  }

  generateQr(encrypted: boolean = true): void {
    if (!this.storageUnitId) return;
    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) return;
      this.executeQrGeneration(encrypted);
    });
  }

  private executeQrGeneration(encrypted: boolean): void {
    if (!this.storageUnitId) return;

    this.generatingQr = true;
    this.storageService.generateQrCode(this.storageUnitId).subscribe({
      next: (response) => {
        this.generatingQr = false;

        if (this.storageUnit) {
          this.storageUnit = {
            ...this.storageUnit,
            publicCode: response.publicCode,
            qrHex: response.publicCode,
            qrUrl: response.qrUrl,
            qrImageBase64: response.qrImageBase64
          };
        }

        this.dialog.open(QrDialogComponent, {
          width: '400px',
          data: {
            qrText: response.publicCode,
            qrImageBase64: response.qrImageBase64,
            encrypted: encrypted,
            payloadType: 'STORAGEUNIT',
            payloadMode: 'PUBLIC_CODE'
          }
        });
      },
      error: (error) => {
        this.generatingQr = false;
        console.error('Error generating QR:', error);
        this.toastService.error('QR.ERROR.GENERATE');
      }
    });
  }

  private confirmQrRegeneration(onResolved: (confirmed: boolean) => void): void {
    if (!this.hasQrCode()) {
      onResolved(true);
      return;
    }

    this.confirmationDialog.confirm({
      title: 'Regenerate QR Code',
      message: 'This will regenerate the QR code and may invalidate already printed physical QR labels.',
      type: ConfirmationType.WARNING,
      confirmText: 'Regenerate',
      cancelText: 'Cancel',
      showIcon: true,
      destructive: true,
      requiredText: 'OKAY',
      requiredTextHint: 'To continue, type OKAY in the field below.',
      requiredTextPlaceholder: 'Type OKAY'
    }).pipe(take(1))
      .subscribe((result) => {
        onResolved(!!result?.confirmed);
      });
  }

  private setupConfig(storageUnitId: string | null) {
    this.dashboardConfig = {
      title: '',
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
              operation: SearchOperation.AND,
              searchs: [
                {
                  operation: SearchOperation.OR,
                  searchs: [
                    {
                      operation: SearchOperation.AND,
                      search: {
                        isDeleted: { equalValue: false },
                        'storageUnitDestination.id': { equalValue: storageUnitId }
                      }
                    },
                    {
                      operation: SearchOperation.AND,
                      search: {
                        isDeleted: { equalValue: false },
                        'storageUnitSource.id': { equalValue: storageUnitId }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      },
      fields: [
        {
          name: 'transactionType',
          label: 'Transaction Type',
          labelTranslatePath: 'TRANSACTIONS.FIELDS.TRANSACTION_TYPE',
          attributeType: AttributeType.enum,
          fieldType: FieldType.select,
          sortable: true,
          exportable: true,
          dataTable: true,
          filterable: true,
          options: [
            { value: 'RECEPTION_IN', label: 'Réception Entrée', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.RECEPTION_IN' },
            { value: 'TRANSFER_IN',  label: 'Transfert Entrée', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' },
            { value: 'LOAN',         label: 'Prêt',             labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.LOAN' },
            { value: 'SALE',         label: 'Vente',            labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.SALE' }
          ]
        },
        {
          name: 'quantityKg',
          label: 'Quantity (kg)',
          labelTranslatePath: 'STORAGE.VIEW.QUANTITY_KG',
          attributeType: AttributeType.number,
          fieldType: FieldType.text,
          sortable: true,
          exportable: true,
          dataTable: true
        },
        {
          name: 'unitPrice',
          label: 'Unit Price',
          labelTranslatePath: 'STORAGE.VIEW.UNIT_PRICE',
          isCurrency: true,
          currency: 'TND',
          attributeType: AttributeType.number,
          fieldType: FieldType.text,
          sortable: true,
          exportable: true,
          filterable: true,
          dataTable: true
        },
        {
          name: 'totalPrice',
          label: 'Total Price',
          labelTranslatePath: 'STORAGE.VIEW.TOTAL_PRICE',
          attributeType: AttributeType.number,
          fieldType: FieldType.text,
          sortable: true,
          exportable: true,
          dataTable: true
        },
        {
          name: 'qualityGrade',
          label: 'Quality Grade',
          labelTranslatePath: 'STORAGE.VIEW.QUALITY_GRADE',
          attributeType: AttributeType.string,
          fieldType: FieldType.text,
          exportable: true,
          sortable: true,
          dataTable: true
        },
        {
          name: 'createdDate',
          label: 'Created Date',
          labelTranslatePath: 'STORAGE.VIEW.CREATED_DATE',
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

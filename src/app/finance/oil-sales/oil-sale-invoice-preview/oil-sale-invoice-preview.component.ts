import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxPrintModule } from 'ngx-print';
import { Subject, takeUntil } from 'rxjs';
import { CardComponent } from '../../../theme/components/card/card.component';
import { OilSaleService } from '../../service/oil-sale.service';
import { OilContainerSaleLine, OilSale, OilSaleStatus } from '../../models/oil-sale.model';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { DocumentGenerationService } from '../../../shared/services/document-generation.service';
import { ToastService } from '../../../shared/services/toast.service';

interface InvoiceLineRow {
  id: number;
  name: string;
  description: string;
  qty: number;
  price: number;
}

interface InvoiceAddressBlock {
  type: string;
  name: string;
  street: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-oil-sale-invoice-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    TranslateModule,
    NgxPrintModule,
    CardComponent
  ],
  templateUrl: './oil-sale-invoice-preview.component.html',
  styleUrl: './oil-sale-invoice-preview.component.scss'
})
export class OilSaleInvoicePreviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly oilSaleService = inject(OilSaleService);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly documentGenerationService = inject(DocumentGenerationService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  loading = true;
  oilSale?: OilSale;
  companyProfile?: CompanyProfile;
  logoUrl: string | null = null;

  displayedColumns = ['id', 'name', 'description', 'qty', 'price', 'amount'];
  lineRows: InvoiceLineRow[] = [];
  addressBlocks: InvoiceAddressBlock[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('AUTO.NO_OIL_SALE_ID_PROVIDED');
      this.router.navigate(['/finance/oil-sales']);
      return;
    }

    this.loadCompanyProfile();
    this.loadOilSale(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get invoiceNumber(): string {
    return this.oilSale?.invoiceNumber || `OSM-${this.oilSale?.id?.slice(0, 8) || ''}`;
  }

  get paymentStatusLabel(): string {
    if (!this.oilSale) {
      return '';
    }
    if ((this.oilSale.unpaidAmount ?? 0) <= 0) {
      return this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PAID');
    }
    if ((this.oilSale.paidAmount ?? 0) > 0) {
      return this.translate.instant('MENU.FINANCE.DASHBOARD.INVOICE_PREVIEW.PARTIAL');
    }
    return this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING');
  }

  get statusClass(): string {
    if (!this.oilSale) {
      return 'bg-warning-100 text-warning-700';
    }
    if ((this.oilSale.unpaidAmount ?? 0) <= 0) {
      return 'bg-success-100 text-success-700';
    }
    return 'bg-warning-100 text-warning-700';
  }

  get subTotal(): number {
    return this.lineRows.reduce((sum, row) => sum + row.qty * row.price, 0);
  }

  get grandTotal(): number {
    return this.oilSale?.totalAmount ?? this.subTotal;
  }

  get paidAmount(): number {
    return this.oilSale?.paidAmount ?? 0;
  }

  get unpaidAmount(): number {
    return this.oilSale?.unpaidAmount ?? 0;
  }

  canDownloadPdf(): boolean {
    return (
      !!this.oilSale?.id &&
      (this.oilSale.status === OilSaleStatus.CONFIRMED || this.oilSale.status === OilSaleStatus.DELIVERED)
    );
  }

  onBack(): void {
    if (this.oilSale?.id) {
      this.router.navigate(['/finance/oil-sales', this.oilSale.id, 'view']);
      return;
    }
    this.router.navigate(['/finance/oil-sales']);
  }

  onDownloadPdf(): void {
    if (this.oilSale?.id && this.canDownloadPdf()) {
      this.documentGenerationService.downloadOilSaleInvoicePdf(this.oilSale.id);
    }
  }

  lineTotal(row: InvoiceLineRow): number {
    return row.qty * row.price;
  }

  private loadCompanyProfile(): void {
    const cached = this.companyProfileService.getProfileFromCache();
    if (cached) {
      this.applyCompanyProfile(cached);
    }

    this.companyProfileService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => this.applyCompanyProfile(profile),
        error: () => {
          if (!this.companyProfile) {
            this.companyProfile = undefined;
          }
        }
      });
  }

  private applyCompanyProfile(profile: CompanyProfile): void {
    this.companyProfile = profile;
    this.logoUrl = this.companyProfileService.getLogoDataUrlFromCache() ?? 'assets/images/logo-dark.svg';
  }

  private loadOilSale(id: string): void {
    this.loading = true;
    this.oilSaleService
      .getOilSale(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.oilSale = Array.isArray(response.data) ? response.data[0] : response.data;
            this.buildInvoiceView();
          } else {
            this.toast.error('AUTO.NO_OIL_SALE_ID_PROVIDED');
            this.router.navigate(['/finance/oil-sales']);
          }
          this.loading = false;
        },
        error: () => {
          this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DU_TABLEAU_DE_BORD');
          this.loading = false;
          this.router.navigate(['/finance/oil-sales']);
        }
      });
  }

  private buildInvoiceView(): void {
    if (!this.oilSale) {
      return;
    }

    const qualityLabel = this.oilSale.qualityGrade
      ? this.translate.instant(`OIL_TRANSACTIONS.QUALITY_GRADES.${this.oilSale.qualityGrade}`)
      : this.translate.instant('OIL_SALES.SALE_DETAILS');

    this.lineRows = [
      {
        id: 1,
        name: this.translate.instant('MENU.FINANCE.OIL_SALES'),
        description: qualityLabel,
        qty: this.oilSale.quantity,
        price: this.oilSale.unitPrice
      }
    ];

    (this.oilSale.containerSales ?? []).forEach((line: OilContainerSaleLine, index: number) => {
      this.lineRows.push({
        id: index + 2,
        name: line.containerName || this.translate.instant('OIL_SALES.CONTAINER_SALES'),
        description: `${line.capacityInLiters ?? ''} L`,
        qty: line.count,
        price: line.unitPrice ?? 0
      });
    });

    const issuerAddress = [
      this.companyProfile?.addressLine1,
      this.companyProfile?.postalCode,
      this.companyProfile?.city,
      this.companyProfile?.governorate
    ]
      .filter(Boolean)
      .join(', ');

    this.addressBlocks = [
      {
        type: this.translate.instant('MENU.FINANCE.DASHBOARD.INVOICE_PREVIEW.FROM'),
        name: this.companyProfile?.legalName || 'OSM',
        street: issuerAddress || '-',
        phone: this.companyProfile?.phone || '-',
        email: this.companyProfile?.email || '-'
      },
      {
        type: this.translate.instant('MENU.FINANCE.DASHBOARD.INVOICE_PREVIEW.TO'),
        name: this.getSupplierName(),
        street: this.oilSale.supplier?.address || '-',
        phone: this.oilSale.supplier?.phone || '-',
        email: this.oilSale.supplier?.email || '-'
      }
    ];
  }

  private getSupplierName(): string {
    const supplier = this.oilSale?.supplier;
    if (!supplier) {
      return '-';
    }
    return supplier.fullName || [supplier.name, supplier.lastname].filter(Boolean).join(' ').trim() || '-';
  }
}

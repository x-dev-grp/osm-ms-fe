import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, tap } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';
 import { OIL_CREDIT_DASHBOARD } from './osmDashConf/oil-credit-dashboard.config';
import { PAIMENT_DASHBOARD } from './osmDashConf/paiment-dashboard.config';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { SupplierPaymentHistoryComponent } from '../supplier-payment-history/supplier-payment-history.component';
import { OIL_SALES_DASHBOARD_CONFIG } from './osmDashConf/oil-sales-dashboard.config';
import { ToastService } from '../../../shared/services/toast.service';
import { PdfGeneratorFactureService } from '../../../shared/services/pdf-generator-facture.service';
import { WASTE_DASHBOARD } from './osmDashConf/waste-sale-dashboard.config';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SupplierPaymentHistoryMobileComponent } from '../supplier-payment-history-mobile/supplier-payment-history-mobile.component';
import { PdfConfigFactoryService } from '../../../shared/services/pdf-config-factory.service';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { CardComponent } from '../../../theme/components/card/card.component';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { Linter } from 'eslint';
import SourceType = Linter.SourceType;
import { OilSale } from '../../../finance/models/oil-sale.model';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { WasteSale } from '../../../finance/models/Waste.model';

export enum PaymentSourceType {
  DELIVERY_prc = 'delivery',
  OIL_SALE_prc = 'oil_sale',
  WASTE_SALE_prc = 'waste_sale'
}

export enum InvoiceSource {
  DELIVERY_inv = 'delivery',
  OIL_SALE_inv = 'oil_sale',
  WASTE_SALE_inv = 'waste_sale',
  OLIVE_PURCHASE_inv = 'OLIVE_PURCHASE'
}

@Component({
  selector: 'app-supplier-details',
  templateUrl: './supplier-details.component.html',
  styleUrls: ['./supplier-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OsmDashboard,
    TranslateModule,
    CardComponent
  ]
})
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  destroyRef = inject(DestroyRef);
  loading: boolean = false;
  paidCount: number = 0;
  unpaidCount: number = 0;
  creditsCount: number = 0;
  supplierId: string | null = null;
  isOilCredit: boolean = false;
  isWasteSale: boolean = false;
  isOilSale: boolean = false;
  isPayment: boolean = false;
  companyProfile?: CompanyProfile;

  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  WASTE_DASHBOARD: DashboardConfig = WASTE_DASHBOARD;
  PAIMENT_DASHBOARD: DashboardConfig = PAIMENT_DASHBOARD;
  OIL_SALES_DASHBOARD_CONFIG = OIL_SALES_DASHBOARD_CONFIG;
  unpaidSUM: number;
  paidSum: string;
  @ViewChild('dashboardOilCredit') dashboardOilCredit!: OsmDashboard;
  @ViewChild('dashboardPaiments') dashboardPaiments!: OsmDashboard;
  @ViewChild('dashboardOilSale') dashboardOilSale!: OsmDashboard;
  @ViewChild('dashboardWasteSale') dashboardWasteSale!: OsmDashboard; // NEW
  // Oil sales metrics
  protected paidOilSalesCount: number = 0;
  protected unpaidOilSalesCount: number = 0;
  protected paidOilSalesSUM: number;
  protected unpaidOilSalesSum: number;
  // Waste sales metrics (NEW)
  protected paidWasteSalesCount: number = 0;
  protected unpaidWasteSalesCount: number = 0;
  protected paidWasteSalesSUM: number;
  protected unpaidWasteSalesSum: number;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog,
    // private invoiceService: InvoiceService,
    private breakpointObserver: BreakpointObserver,
    private toast: ToastService,
    private pdfFactureService: PdfGeneratorFactureService,
    private companyService: CompanyProfileService,
    private pdfFactory: PdfConfigFactoryService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.loadPaymentHistory(false);
    this.countData();
  }

  handlePaymentAction(e: { row: any; action: string }) {
    const actionLabel = e.action;
    switch (actionLabel) {
      case 'GEN_INVOICE':
        if (e.row) {
          const row: Row = e.row;
          const sourceType = this.getCurrentInvoceSourceType();
          const cfg = this.pdfFactory.build(e.row,sourceType);

          const hasDebt = hasUnpaidAmount(row) && row.unpaidAmount > 0;

          // if (hasDebt) {
          //   this.pdfFactureService.generatePdfNoteDocument(cfg);
          // } else {
          //   this.pdfFactureService.generatePdfDocument(cfg);
          // }


          // Vérifier si c'est une note de paiement ou une facture
          if ('total' in cfg && 'paid' in cfg && 'unpaid' in cfg) {
            this.pdfFactureService.generatePdfNoteDocument(cfg);
          } else {
            this.pdfFactureService.generatePdfDocument(cfg);
          }
        }
        break;

      case 'PAY':
        const sourceType = this.getCurrentPaymentSourceType();

        this.initiatePayment(e.row, sourceType);
        break;
    }
  }
  initiatePayment(row: any, sourceType: string) {
    const isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset || Breakpoints.TabletPortrait);

    const Comp = isMobile ? SupplierPaymentHistoryMobileComponent : SupplierPaymentHistoryComponent;

    const dialogRef = this._dialog.open(Comp, {
      width: isMobile ? '100vw' : '41vw',
      height: isMobile ? '70vh' : '100vh',
      data: { row, sourceType },
      autoFocus: false,
      disableClose: true,
      panelClass: isMobile ? 'mobile-bottom-sheet' : 'desktop-payment-dialog',
      // keep backdrop for sheet style
      hasBackdrop: true
    });

    if (!isMobile) {
      dialogRef.updatePosition({ right: '0px', top: '0px' });
    }

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((result) => {
          if (result.ok) {
            this.toast.success(result.message || 'Paiement réussi.');
            this.refreshPaymentList();
            this.countData();
          } else {
            this.toast.error(result.message || 'Échec du paiement.');
            // Optionnel: logger l’erreur ou afficher un détail
          }
        })
      )
      .subscribe();
  }

  /* =========================
   * LOADERS (sections)
   * ========================= */

  loadOilCredits(): void {
    this.OIL_CREDIT_DASHBOARD = {
      ...this.OIL_CREDIT_DASHBOARD,
      defaultSearchData: {
        ...this.OIL_CREDIT_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.OIL_CREDIT_DASHBOARD.defaultSearchData?.searchData,
          search: {
            isDeleted: {
              equalValue: false
            },
            ...this.OIL_CREDIT_DASHBOARD.defaultSearchData?.searchData?.search,
            destinataire: {
              equalValue: this.supplierId
            }
          }
        }
      }
    };
    this.isOilCredit = true;
    this.isOilSale = false;
    this.isPayment = false;
    this.isWasteSale = false;
  }

  // NEW: paid/unpaid waste-sale history (mirrors oil sales)
  loadWasteSalesHistory(isPaid: boolean): void {
    this.WASTE_DASHBOARD = {
      ...this.WASTE_DASHBOARD,
      title: isPaid ? 'Historique paiements Déchets' : 'Paiements Déchets en attente',
      defaultSearchData: {
        ...this.WASTE_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.WASTE_DASHBOARD.defaultSearchData?.searchData,
          search: {
            ...this.WASTE_DASHBOARD.defaultSearchData?.searchData?.search,
            'supplier.id': { equalValue: this.supplierId! },
            paid: { equalValue: isPaid }
          }
        }
      }
    };
    this.isOilCredit = false;
    this.isOilSale = false;
    this.isPayment = false;
    this.isWasteSale = true;
  }

  loadPaymentHistory(isPaid: boolean): void {
    this.isPayment = true;
    this.isOilCredit = false;
    this.isOilSale = false;
    this.isWasteSale = false;

    this.PAIMENT_DASHBOARD = {
      ...this.PAIMENT_DASHBOARD,
      title: isPaid ? 'Historique paiements' : 'Paiements en attente',
      titleTranslatePath: isPaid ? 'SUPPLIER.DETAILS.PAYMENT_HISTORY_TITLE' : 'SUPPLIER.DETAILS.UNPAID_TITLE',
      defaultSearchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
          search: {
            ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData?.search,
            paid: { equalValue: isPaid },
            'supplier.id': { equalValue: this.supplierId! }
          }
        }
      }
    };
  }

  loadOilSalesHistory(isPaid: boolean): void {
    this.OIL_SALES_DASHBOARD_CONFIG = {
      ...this.OIL_SALES_DASHBOARD_CONFIG,
      title: isPaid ? 'Historique paiements Des ventes huile' : 'Paiements ventes huile en attente',
      defaultSearchData: {
        ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData,
        searchData: {
          ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData,
          search: {
            ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData?.search,
            'supplier.id': { equalValue: this.supplierId! },
            paid: { equalValue: isPaid }
          }
        }
      }
    };

    this.isOilCredit = false;
    this.isOilSale = true;
    this.isPayment = false;
    this.isWasteSale = false;
  }

  countData(): void {
    // Oil sales metrics
    this.paidOilSales();
    this.unpaidOilSales();

    // Waste sales metrics (NEW)
    this.paidWasteSales();
    this.unpaidWasteSales();

    // Payments & credits
    this.paidCountSearchData();
    this.unpaidCountSearchDta();
    this.creditCountSearchDta();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* =========================
   * COUNTS / SUMS
   * ========================= */

  protected paidOilSales() {
    const search: SearchData = {
      ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData,
      searchData: {
        ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: true },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };
    this.searchService
      .search(search, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidOilSalesCount = res?.total || 0;
          const items = res?.data ?? [];
          this.paidOilSalesSUM = items.reduce((sum: number, it: any) => {
            const v = Number(it?.paiedAmount ?? it?.paidAmount ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  protected unpaidOilSales() {
    const search: SearchData = {
      ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData,
      searchData: {
        ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: false },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };
    this.searchService
      .search(search, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidOilSalesCount = res?.total || 0;
          const items = res?.data ?? [];
          this.unpaidOilSalesSum = items.reduce((sum: number, it: any) => {
            const v = Number(it?.unpaidAmount ?? it?.unpaid ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  /* ---------- Oil Sales ---------- */

  protected paidWasteSales() {
    const search: SearchData = {
      ...this.WASTE_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.WASTE_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: true },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };
    this.searchService
      // If your backend path differs, adjust here (e.g., 'production/waste_sale')
      .search(search, 'production/waste')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidWasteSalesCount = res?.total || 0;
          const items = res?.data ?? [];
          this.paidWasteSalesSUM = items.reduce((sum: number, it: any) => {
            const v = Number(it?.totalPrice ?? it?.totalPrice ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  protected unpaidWasteSales() {
    const search: SearchData = {
      ...this.WASTE_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.WASTE_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: false },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };
    this.searchService
      // If your backend path differs, adjust here (e.g., 'production/waste_sale')
      .search(search, 'production/waste')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidWasteSalesCount = res?.total || 0;
          const items = res?.data ?? [];
          this.unpaidWasteSalesSum = items.reduce((sum: number, it: any) => {
            const v = Number(it?.unpaidAmount ?? it?.unpaid ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  /* ---------- Waste Sales (NEW) ---------- */

  private getCurrentPaymentSourceType(): PaymentSourceType {
    if (this.isOilSale) return PaymentSourceType.OIL_SALE_prc;
    if (this.isWasteSale) return PaymentSourceType.WASTE_SALE_prc;
    return PaymentSourceType.DELIVERY_prc;
  }

  private getCurrentInvoceSourceType(): InvoiceSource {
    if (this.isOilSale) return InvoiceSource.OIL_SALE_inv;
    if (this.isWasteSale) return InvoiceSource.WASTE_SALE_inv;
    return InvoiceSource.DELIVERY_inv;
  }

  /* ---------- Credits / Payments ---------- */

  private creditCountSearchDta() {
    const search: SearchData = {
      page: 0,
      size: 1,
      searchData: {
        search: {
          isDeleted: { equalValue: false },
          destinataire: { equalValue: this.supplierId! }
        }
      }
    };

    this.searchService
      .search(search, 'finance/oil-credit')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.creditsCount = res?.total || 0;
        })
      )
      .subscribe();
  }

  private unpaidCountSearchDta() {
    const search: SearchData = {
      ...this.PAIMENT_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: false },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };

    this.searchService
      .search(search, 'production/deliveries')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidCount = res?.total || 0;
          const items = res?.data ?? [];
          this.unpaidSUM = items.reduce((sum: number, it: any) => {
            const v = Number(it?.unpaidAmount ?? it?.unpaid ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  private paidCountSearchData() {
    const search: SearchData = {
      ...this.PAIMENT_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: { equalValue: false },
          paid: { equalValue: true },
          'supplier.id': { equalValue: this.supplierId! }
        }
      }
    };
    this.searchService
      .search(search, 'production/deliveries')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidCount = res?.total || 0;
          const items = res?.data ?? [];
          this.paidSum = items.reduce((sum: number, it: any) => {
            const v = Number(it?.paidAmount ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
        })
      )
      .subscribe();
  }

  /* =========================
   * REFRESH
   * ========================= */

  private refreshPaymentList() {
    if (this.dashboardOilCredit) this.dashboardOilCredit.refrechData();
    if (this.dashboardPaiments) this.dashboardPaiments.refrechData();
    if (this.dashboardOilSale) this.dashboardOilSale.refrechData();
    if (this.dashboardWasteSale) this.dashboardWasteSale.refrechData();
    this.countData();
  }
}
type Row = OilSale | UnifiedDelivery | WasteSale;

function hasUnpaidAmount(x: unknown): x is { unpaidAmount: number } {
  return !!x && typeof (x as any).unpaidAmount === 'number';
}



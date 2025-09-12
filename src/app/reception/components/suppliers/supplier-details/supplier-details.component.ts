import {Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, tap} from 'rxjs';
import {OsmDashboard} from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import {DashboardConfig} from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import {TranslateModule} from '@ngx-translate/core';
import {CardComponent} from '../../../../theme/components/card/card.component';
import {OIL_CREDIT_DASHBOARD} from './oil-credit-dashboard.config';
import {PAIMENT_DASHBOARD} from './paiment-dashboard.config';
import {AdvancedSearchService} from '../../../../shared/services/advanced-serach.service';
import {SearchData} from '../../../../shared/models/advanced-search/searchData';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {OilCredit} from '../../../../finance/models/OilCredit';
import {UnifiedDelivery} from '../../../../shared/models/UnifiedDelivery';
import {MatDialog} from '@angular/material/dialog';
import {SupplierPaymentHistoryComponent} from '../supplier-payment-history/supplier-payment-history.component';
import {OIL_SALES_DASHBOARD_CONFIG} from './oil-sales-dashboard.config';
import {ToastService} from '../../../../shared/services/toast.service';
import {factureTriturationConfig} from '../../../../finance/facture-config/facture-Trituration-Config';
import {PdfGeneratorFactureService} from '../../../../shared/services/pdf-generator-facture.service';
import {PdfFactureConfig} from '../../../../shared/models/pdf-config.model';
import {WASTE_DASHBOARD} from './waste-sale-dashboard.config';
import {CompanyProfile} from '../../../../shared/models/CompanyProfile';
import {CompanyProfileService} from '../../../../shared/services/company-profile.service';

export enum PaymentSourceType {
  DELIVERY_prc = 'delivery',
  OIL_SALE_prc = 'oil_sale',
  WASTE_SALE_prc = 'waste_sale'
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

  @ViewChild('dashboardOilCredit') dashboardOilCredit!: OsmDashboard;
  @ViewChild('dashboardPaiments') dashboardPaiments!: OsmDashboard;
  @ViewChild('dashboardOilSale') dashboardOilSale!: OsmDashboard;
  @ViewChild('dashboardWasteSale') dashboardWasteSale!: OsmDashboard; // NEW

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog,
    // private invoiceService: InvoiceService,
    private toast: ToastService,
    private pdfFactureService: PdfGeneratorFactureService,
    private companyService: CompanyProfileService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.loadPaymentHistory(false);
    this.countData();
    this.getProfileInfo();
  }

  handleCreditAction(e: { row: OilCredit; action: string }) {
    const actionLabel = e.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/expenses', e.row.id, 'view']);
        break;

      case 'PRINT':
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/expenses', e.row.id, 'edit']);
        break;

      case 'DELETE':
        break;

      case 'GEN_INVOICE':
        if (e.row?.id) {
          this.generateOilCreditInvoice(e.row);
        }
        break;
    }
  }

  handlePaymentAction(e: { row: UnifiedDelivery; action: string }) {
    const actionLabel = e.action;
    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/expenses', e.row.id, 'view']);
        break;

      case 'PRINT':
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/expenses', e.row.id, 'edit']);
        break;

      case 'GEN_INVOICE':
        if (e.row) {
          console.log(`[OilReception] Generating invoice for delivery: ${e.row.lotNumber}`);

          if (!this.companyProfile) {
            console.error('[CompanyProfile] Company profile not loaded yet!');
            return;
          }
          const config = this.getInvoicePdfConfig(e.row, this.companyProfile);
          this.pdfFactureService.generatePdfDocument(config);
        }
        break;
      case 'PAY':
        const sourceType = this.getCurrentPaymentSourceType();

        this.initiatePayment(e.row, sourceType);
        break;
    }
  }

  getInvoicePdfConfig(delivery: UnifiedDelivery, company: CompanyProfile): PdfFactureConfig {
    switch (delivery.operationType) {
      case 'SIMPLE_RECEPTION' :
      case 'EXCHANGE':
      case 'BASE':
        return factureTriturationConfig(delivery, company);
      default:
        throw new Error(`[Invoice] Unsupported operationType: ${delivery.operationType}`);
    }
  }

  getProfileInfo() {
    this.companyService.getProfile().subscribe({
      next: (response: any) => {
        this.companyProfile = response;
        console.log('[CompanyProfile] Loaded company profile:', this.companyProfile);
      },
      error: (err) => {
        console.error('[CompanyProfile] Error fetching company info:', err);
      }
    });
  }

  initiatePayment(row: any, sourceType: string) {
    let dialogRef = this._dialog.open(SupplierPaymentHistoryComponent, {
      width: '41vw',
      height: '100vw',
      data: {
        row: row,
        sourceType: sourceType
      },
      autoFocus: false,
      disableClose: true
    });
    dialogRef.updatePosition({ right: '0px', top: '0px' });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((result) => {
          if (!result) {
            // cas annulation si tu fermes sans résultat
            return;
          }

          if (result.ok) {
            this.toast.success(result.message || 'Paiement réussi.');
            this.refreshPaymentList(); // recharge la liste / total / soldes
          } else {
            this.toast.error(result.message || 'Échec du paiement.');
            // Optionnel: logger l’erreur ou afficher un détail
          }
        })
      )
      .subscribe();
  }

  private generateOilCreditInvoice(creditData: any) {
    if (!creditData) {
      console.error('generateOilCreditInvoice: creditData is undefined');
      return;
    }
    console.log('generateOilCreditInvoice - creditData:', creditData);
    // this.invoiceService.generateOilCreditInvoice(creditData);
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

  // Existing "all waste sale" view kept as-is
  loadWasteSale(): void {
    this.WASTE_DASHBOARD = {
      ...this.WASTE_DASHBOARD,
      defaultSearchData: {
        ...this.WASTE_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.WASTE_DASHBOARD.defaultSearchData?.searchData,
          search: {
            isDeleted: { equalValue: false },
            ...this.WASTE_DASHBOARD.defaultSearchData?.searchData?.search,
            'supplier.id': { equalValue: this.supplierId }
          }
        }
      }
    };
    this.isOilCredit = false;
    this.isOilSale = false;
    this.isPayment = false;
    this.isWasteSale = true;
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
  private getCurrentPaymentSourceType(): PaymentSourceType {
    if (this.isOilSale) return PaymentSourceType.OIL_SALE_prc;
    if (this.isWasteSale) return PaymentSourceType.WASTE_SALE_prc;
    return PaymentSourceType.DELIVERY_prc;
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

  /* =========================
   * COUNTS / SUMS
   * ========================= */

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

  /* ---------- Oil Sales ---------- */

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

  /* ---------- Waste Sales (NEW) ---------- */

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

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
import {UnifiedDelivery} from '../../../../shared/models/UnifiedDelivery';
import {MatDialog} from '@angular/material/dialog';
import {SupplierPaymentHistoryComponent} from '../supplier-payment-history/supplier-payment-history.component';
import {OIL_SALES_DASHBOARD_CONFIG} from './oil-sales-dashboard.config';
import {ToastService} from '../../../../shared/services/toast.service';
import {factureTriturationConfig} from "../../../../finance/facture-config/facture-Trituration-Config";
import {PdfGeneratorFactureService} from "../../../../shared/services/pdf-generator-facture.service";
import {PdfFactureConfig} from "../../../../shared/models/pdf-config.model";
import {CompanyProfile} from "../../../../shared/models/CompanyProfile";
import {CompanyProfileService} from "../../../../shared/services/company-profile.service";


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
  isOilSale: boolean = false;
  isPayment: boolean = false;
  companyProfile?: CompanyProfile;

  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  PAIMENT_DASHBOARD: DashboardConfig = PAIMENT_DASHBOARD;
  OIL_SALES_DASHBOARD_CONFIG = OIL_SALES_DASHBOARD_CONFIG;
  unpaidSUM: string;
  paidSum: string;
  paidOilSalesSUM: string;
  unpaidOilSalesSum: string;
  @ViewChild('dashboardOilCredit') dashboardOilCredit!: OsmDashboard;
  @ViewChild('dashboardPaiments') dashboardPaiments!: OsmDashboard;
  @ViewChild('dashboardOilSale') dashboardOilSale!: OsmDashboard;
  // Function to load payment history based on whether the payment is paid or not
  protected paidOilSalesCount: any;
  protected unpaidOilSalesCount: any;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog,
    // private invoiceService: InvoiceService,
    private toast: ToastService,
    private pdfFactureService: PdfGeneratorFactureService,
    private companyService: CompanyProfileService,
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.loadPaymentHistory(false);
    this.countData();
    this.getProfileInfo();
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
        this.initiatePayment(e.row);
        break;
    }
  }


  getInvoicePdfConfig(delivery: UnifiedDelivery, company: CompanyProfile
  ): PdfFactureConfig {
    switch (delivery.operationType) {
      case 'SIMPLE_RECEPTION':
        return factureTriturationConfig(delivery, company);

      // case 'EXCHANGE':
      // case 'BASE':
      //   return factureVenteHuileConfig(delivery, company);
      //
      // case 'DECHET':
      //   return factureDechetConfig(delivery, company);

      default:
        throw new Error(
          `[Invoice] Unsupported operationType: ${delivery.operationType}`
        );
    }
  }


  getProfileInfo(){
    this.companyService.getProfile().subscribe({
      next: (response:any) => {
        this.companyProfile = response;
        console.log('[CompanyProfile] Loaded company profile:', this.companyProfile);
      },
      error: (err) => {
        console.error('[CompanyProfile] Error fetching company info:', err);
      }
    });
  }


  initiatePayment(row: any) {
    let dialogRef = this._dialog.open(SupplierPaymentHistoryComponent, {
      width: '41vw',
      height: '100vw',
      data: {
        row: row
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
            this.toast.error(result.message || 'Échec du paiement.' );
            // Optionnel: logger l’erreur ou afficher un détail
          }
        })
      )
      .subscribe();
  }


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
  }

  loadPaymentHistory(isPaid: boolean): void {
    this.isPayment = true;
    this.isOilCredit = false;
    this.isOilSale = false;
    // Set PAIMENT_DASHBOARD object with title and titleTranslatePath based on whether the payment is paid or not
    this.PAIMENT_DASHBOARD = {
      ...this.PAIMENT_DASHBOARD,
      title: isPaid ? 'Historique paiements' : 'Paiements en attente',
      titleTranslatePath: isPaid ? 'SUPPLIER.DETAILS.PAYMENT_HISTORY_TITLE' : 'SUPPLIER.DETAILS.UNPAID_TITLE', // Set defaultSearchData object with searchData object based on whether the payment is paid or not
      defaultSearchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
          search: {
            ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData?.search, // Set supplier.id and paid equalValue based on whether the payment is paid or not
            paid: {
              equalValue: isPaid
            },
            'supplier.id': {
              equalValue: this.supplierId!
            }
          }
        }
      }
    };
    // Call countData function
    // this.countData();
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
            'supplier.id': {
              equalValue: this.supplierId!
            },
            paid: {
              equalValue: isPaid
            }
          }
        }
      }
    };

    this.isOilCredit = false;
    this.isOilSale = true;
    this.isPayment = false;
  }

  countData(): void {
    this.paidOilSales();
    this.unpaidOilSales();
    this.paidCountSearchData();
    this.unpaidCountSearchDta();
    this.creditCountSearchDta();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected paidOilSales() {
    const paidOilSalesData: SearchData = {
      ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData,
      searchData: {
        ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          paid: {
            equalValue: true
          },
          'supplier.id': {
            equalValue: this.supplierId!
          }
        }
      }
    };
    this.searchService
      .search(paidOilSalesData, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidOilSalesCount = res?.total || 0;

          const items = res?.data ?? [];
          // Adapte le nom du champ si besoin : unpaidAmount / remainingAmount / resteAPayer / unpaid
          this.paidOilSalesSUM = items.reduce((sum: number, it: any) => {
            const v = Number(it?.paiedAmount ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);

          console.log('[Supplier] Somme impayée (page courante):', this.paidOilSalesSUM);
        })
      )
      .subscribe();
  }

  protected unpaidOilSales() {
    const paidOilSalesData: SearchData = {
      ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData,
      searchData: {
        ...this.OIL_SALES_DASHBOARD_CONFIG.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          paid: {
            equalValue: false
          },
          'supplier.id': {
            equalValue: this.supplierId!
          }
        }
      }
    };
    this.searchService
      .search(paidOilSalesData, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidOilSalesCount = res?.total || 0;

          const items = res?.data ?? [];
          // Adapte le nom du champ si besoin : unpaidAmount / remainingAmount / resteAPayer / unpaid
          this.unpaidOilSalesSum = items.reduce((sum: number, it: any) => {
            const v = Number(it?.unpaidAmount ?? it?.unpaid ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);

          console.log('[Supplier] Somme impayée (page courante):', this.unpaidOilSalesSum);
        })
      )
      .subscribe();
  }

  private creditCountSearchDta() {
    const creditCountSearchDta: SearchData = {
      page: 0,
      size: 1,
      searchData: {
        search: {
          isDeleted: {
            equalValue: false
          },
          destinataire: {
            equalValue: this.supplierId!
          }
        }
      }
    };

    this.searchService
      .search(creditCountSearchDta, 'finance/oil-credit')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.creditsCount = res?.total || 0;
        })
      )
      .subscribe();
  }

  private unpaidCountSearchDta() {
    const unpaidCountSearchDta: SearchData = {
      ...this.PAIMENT_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          paid: {
            equalValue: false
          },
          'supplier.id': {
            equalValue: this.supplierId!
          }
        }
      }
    };

    this.searchService
      .search(unpaidCountSearchDta, 'production/deliveries')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidCount = res?.total || 0;
          const items = res?.data ?? [];
          // Adapte le nom du champ si besoin : unpaidAmount / remainingAmount / resteAPayer / unpaid
          this.unpaidSUM = items.reduce((sum: number, it: any) => {
            const v = Number(it?.unpaidAmount ?? it?.unpaid ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);

          console.log('[Supplier] Somme impayée (page courante):', this.unpaidSUM);
        })
      )
      .subscribe();
  }

  private paidCountSearchData() {
    const paidCountSearchDta: SearchData = {
      ...this.PAIMENT_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.PAIMENT_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          paid: {
            equalValue: true
          },
          'supplier.id': {
            equalValue: this.supplierId!
          }
        }
      }
    };
    this.searchService
      .search(paidCountSearchDta, 'production/deliveries')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidCount = res?.total || 0;
          const items = res?.data ?? [];
          // Adapte le nom du champ si besoin : unpaidAmount / remainingAmount / resteAPayer / unpaid
          this.paidSum = items.reduce((sum: number, it: any) => {
            const v = Number(it?.paidAmount ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);

          console.log('[Supplier]  this.paidSum ):', this.paidSum);
        })
      )
      .subscribe();
  }

  private refreshPaymentList() {
    this.dashboardOilCredit.refrechData();
    this.dashboardPaiments.refrechData();
    this.dashboardOilSale.refrechData();
  }
}

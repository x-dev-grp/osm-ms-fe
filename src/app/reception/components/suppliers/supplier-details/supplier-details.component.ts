import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, tap } from 'rxjs';
import { OsmDashboard } from '../../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../../theme/components/card/card.component';
import { OIL_CREDIT_DASHBOARD } from './oil-credit-dashboard.config';
import { PAIMENT_DASHBOARD } from './paiment-dashboard.config';
import { AdvancedSearchService } from '../../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OilCredit } from '../../../../finance/models/OilCredit';
import { UnifiedDelivery } from '../../../../shared/models/UnifiedDelivery';
import { MatDialog } from '@angular/material/dialog';
import { SupplierPaymentHistoryComponent } from '../supplier-payment-history/supplier-payment-history.component';
import { OIL_SALES_DASHBOARD_CONFIG } from './oil-sales-dashboard.config';

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
  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  PAIMENT_DASHBOARD: DashboardConfig = PAIMENT_DASHBOARD;
  // Function to load payment history based on whether the payment is paid or not
  protected paidOilSalesCount: any;
  protected unpaidOilSalesCount: any;
  OIL_SALES_DASHBOARD_CONFIG = OIL_SALES_DASHBOARD_CONFIG;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.loadPaymentHistory(false);
    this.countData();
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

      case 'PAY':
        this.initiatePayment(e.row);
        break;
    }
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
          console.log(result);
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
        })
      )
      .subscribe();
  }
}

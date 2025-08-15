import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, tap } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';

import { OIL_SALES_DASHBOARD_CONFIG } from './oilSales-dashboard.config';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OilTransaction } from '../../../shared/models/OilTransaction';
import { CustomerPaymentComponent } from './customer-payment/customer-payment.component';
import { FinancialTransactionService } from '../../service/financial-transaction.service';

@Component({
  selector: 'app-supplier-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.scss'],
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
export class CustomerDetailsComponent implements OnInit, OnDestroy {
  destroyRef = inject(DestroyRef);
  loading: boolean = false;
  paidCount: number = 0;
  unpaidCount: number = 0;
  customerId: string | null = null;
  OIL_TRANSACTIONS_DASHBOARD: DashboardConfig = OIL_SALES_DASHBOARD_CONFIG;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private financialService: FinancialTransactionService,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.loadPaymentHistory(false);
    this.countData();
  }

  // Function to handle payment actions
  handlePaymentAction(e: { row: OilTransaction; action: string }) {
    switch (e.action) {
      case 'READ':
        this.router.navigate(['/finance/expenses', e.row.id, 'view']);
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
    let dialogRef = this._dialog.open(CustomerPaymentComponent, {
      width: '41vw',
      height: '100vh',
      data: { row },
      autoFocus: false,
      disableClose: true,
      position: { right: '0px', top: '0px' },
      panelClass: 'custom-slide-dialog'
    });
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

  loadPaymentHistory(paid: boolean): void {
    this.OIL_TRANSACTIONS_DASHBOARD = {
      ...this.OIL_TRANSACTIONS_DASHBOARD,
      title: paid ? 'Historique paiements' : 'Paiements en attente',
      titleTranslatePath: paid ? 'SUPPLIER.DETAILS.PAYMENT_HISTORY_TITLE' : 'SUPPLIER.DETAILS.UNPAID_TITLE',
      defaultSearchData: {
        ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData,
        searchData: {
          ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData,
          search: {
            isDeleted: {
              equalValue: false
            },
            ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData?.search,
            'customer.id': {
              equalValue: this.customerId!
            },
            paid: {
              equalValue: paid
            }
          }
        }
      }
    };
  }

  countData(): void {
    const paidCountSearchDta: SearchData = {
      ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData?.search,
          paid: {
            equalValue: true
          }
        }
      }
    };
    const unpaidCountSearchDta: SearchData = {
      ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData,
      searchData: {
        ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData,
        search: {
          isDeleted: {
            equalValue: false
          },
          ...this.OIL_TRANSACTIONS_DASHBOARD.defaultSearchData?.searchData?.search,
          paid: {
            equalValue: false
          }
        }
      }
    };

    this.searchService
      .search(paidCountSearchDta, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.paidCount = res?.total || 0;
        })
      )
      .subscribe();
    this.searchService
      .search(unpaidCountSearchDta, 'production/oil_sale')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.unpaidCount = res?.total || 0;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

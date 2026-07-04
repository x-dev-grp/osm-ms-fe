import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../shared/shared.module';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { CASH_REGISTER_DASHBOARD } from './cash-register-dashboard.config';
import { AdvancedSearchService } from '../../shared/services/advanced-serach.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

interface CashRegisterSummary {
  inbound: number;
  outbound: number;
  net: number;
  count: number;
}

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, SharedModule, OosmDashboard],
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.scss']
})
export class CashRegisterComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchService = inject(AdvancedSearchService);

  dashboardConfig = CASH_REGISTER_DASHBOARD;
  loading = false;
  summary: CashRegisterSummary | null = null;

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading = true;
    this.searchService
      .search(
        {
          page: 0,
          size: 500,
          sort: 'transactionDate',
          order: 'DESC',
          searchData: {
            operation: SearchOperation.AND,
            search: {
              isDeleted: { equalValue: false },
              paymentMethod: { equalValue: 'CASH' }
            }
          }
        },
        'finance/transactions'
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          const rows = res?.data ?? [];
          let inbound = 0;
          let outbound = 0;
          for (const row of rows) {
            const amount = Number(row?.amount ?? 0);
            if (row?.direction === 'INBOUND') {
              inbound += amount;
            } else if (row?.direction === 'OUTBOUND') {
              outbound += amount;
            }
          }
          this.summary = {
            inbound,
            outbound,
            net: inbound - outbound,
            count: res?.total ?? rows.length
          };
          this.loading = false;
        }),
        catchError(() => {
          this.loading = false;
          return of(null);
        })
      )
      .subscribe();
  }
}

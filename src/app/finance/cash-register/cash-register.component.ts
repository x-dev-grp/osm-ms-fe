import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../shared/shared.module';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { buildCashRegisterDashboard, CAISSE_PAYMENT_METHODS, toSearchDateTime } from './cash-register-dashboard.config';
import { AdvancedSearchService } from '../../shared/services/advanced-serach.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import {
  createDefaultDashboardDateRange,
  DashboardDateRange,
  stripDashboardDate
} from '../../shared/components/dashboard/dashboard-preset.util';
import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { createKpiSheet, DashboardExportPayload } from '../../shared/components/dashboard/dashboard-export.models';
import { TranslateService } from '@ngx-translate/core';

interface MethodBreakdown {
  method: string;
  inbound: number;
  outbound: number;
  net: number;
}

interface CashRegisterSummary {
  opening: number;
  inbound: number;
  outbound: number;
  netMovement: number;
  closing: number;
  count: number;
  truncated: boolean;
  byMethod: MethodBreakdown[];
}

const OPENING_STORAGE_PREFIX = 'oosm.cashRegister.opening.';
const SUMMARY_PAGE_SIZE = 1000;

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    SharedModule,
    OosmDashboard,
    DashboardShellComponent
  ],
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.scss']
})
export class CashRegisterComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchService = inject(AdvancedSearchService);
  private readonly translate = inject(TranslateService);
  private readonly reload$ = new Subject<void>();

  dateRange: DashboardDateRange = createDefaultDashboardDateRange('today');
  dashboardConfig: DashboardConfig = buildCashRegisterDashboard(this.dateRange);
  loading = false;
  lastUpdated: Date | null = null;
  summary: CashRegisterSummary | null = null;
  openingBalance = 0;
  exportPayload: DashboardExportPayload | null = null;

  ngOnInit(): void {
    this.reload$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.loading = true;
          return this.searchService
            .search(
              {
                page: 0,
                size: SUMMARY_PAGE_SIZE,
                sort: 'transactionDate',
                order: 'DESC',
                searchData: {
                  operation: SearchOperation.AND,
                  search: {
                    isDeleted: { equalValue: false },
                    paymentMethod: { inValues: [...CAISSE_PAYMENT_METHODS] },
                    transactionDate: {
                      minValueOrEqual: toSearchDateTime(this.dateRange.start, false),
                      maxValueOrEqual: toSearchDateTime(this.dateRange.end, true)
                    }
                  }
                }
              },
              'finance/transactions'
            )
            .pipe(
              tap((res: any) => {
                const rows = res?.data ?? [];
                const total = Number(res?.total ?? rows.length);
                let inbound = 0;
                let outbound = 0;
                const methodMap = new Map<string, { inbound: number; outbound: number }>();
                for (const method of CAISSE_PAYMENT_METHODS) {
                  methodMap.set(method, { inbound: 0, outbound: 0 });
                }
                for (const row of rows) {
                  const amount = Number(row?.amount ?? 0);
                  const method = String(row?.paymentMethod ?? 'CASH').toUpperCase();
                  if (!methodMap.has(method)) {
                    methodMap.set(method, { inbound: 0, outbound: 0 });
                  }
                  const bucket = methodMap.get(method)!;
                  if (row?.direction === 'INBOUND') {
                    inbound += amount;
                    bucket.inbound += amount;
                  } else if (row?.direction === 'OUTBOUND') {
                    outbound += amount;
                    bucket.outbound += amount;
                  }
                }
                const byMethod: MethodBreakdown[] = [...methodMap.entries()].map(([method, totals]) => ({
                  method,
                  inbound: totals.inbound,
                  outbound: totals.outbound,
                  net: totals.inbound - totals.outbound
                }));
                const summary: CashRegisterSummary = {
                  opening: this.openingBalance,
                  inbound,
                  outbound,
                  netMovement: inbound - outbound,
                  closing: this.openingBalance + inbound - outbound,
                  count: total,
                  truncated: total > rows.length,
                  byMethod
                };
                this.summary = summary;
                this.updateExportPayload(summary);
                this.lastUpdated = new Date();
                this.loading = false;
              }),
              catchError(() => {
                this.loading = false;
                this.summary = null;
                this.exportPayload = null;
                return of(null);
              })
            );
        })
      )
      .subscribe();

    this.openingBalance = this.readStoredOpening(this.dateRange);
    this.reload$.next();
  }

  onDateRangeChange(range: DashboardDateRange): void {
    this.dateRange = {
      start: stripDashboardDate(range.start),
      end: stripDashboardDate(range.end),
      preset: range.preset
    };
    this.openingBalance = this.readStoredOpening(this.dateRange);
    this.dashboardConfig = buildCashRegisterDashboard(this.dateRange);
    this.reload$.next();
  }

  onRefresh(): void {
    this.reload$.next();
  }

  onOpeningBalanceChange(raw: string | number): void {
    const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
    this.openingBalance = Number.isFinite(value) ? value : 0;
    this.persistOpening(this.dateRange, this.openingBalance);
    if (this.summary) {
      this.applyOpeningToSummary(this.summary);
      this.updateExportPayload(this.summary);
    }
  }

  methodLabelKey(method: string): string {
    return `TRANSACTIONS.PAYMENT_METHODS.${method}`;
  }

  private applyOpeningToSummary(summary: CashRegisterSummary): void {
    summary.opening = this.openingBalance;
    summary.closing = this.openingBalance + summary.inbound - summary.outbound;
  }

  private updateExportPayload(summary: CashRegisterSummary): void {
    this.exportPayload = {
      fileName: 'cash-register',
      title: this.translate.instant('ABIOOC.CASH_REGISTER.TITLE'),
      sheets: [
        createKpiSheet('Caisse', [
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.OPENING'),
            value: summary.opening
          },
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.INBOUND'),
            value: summary.inbound
          },
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.OUTBOUND'),
            value: summary.outbound
          },
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.NET'),
            value: summary.netMovement
          },
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.CLOSING'),
            value: summary.closing
          },
          {
            label: this.translate.instant('ABIOOC.CASH_REGISTER.MOVEMENTS'),
            value: summary.count
          }
        ])
      ]
    };
  }

  private storageKey(range: DashboardDateRange): string {
    const start = stripDashboardDate(range.start);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${OPENING_STORAGE_PREFIX}${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  }

  private readStoredOpening(range: DashboardDateRange): number {
    try {
      const raw = localStorage.getItem(this.storageKey(range));
      if (raw == null || raw === '') {
        return 0;
      }
      const value = Number(raw);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  private persistOpening(range: DashboardDateRange, value: number): void {
    try {
      localStorage.setItem(this.storageKey(range), String(value));
    } catch {
      // ignore quota / private mode
    }
  }
}

import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../shared/shared.module';
import { AdvancedSearchService } from '../../shared/services/advanced-serach.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

interface SeasonRecapSummary {
  deliveryCount: number;
  oliveKg: number;
  oilLiters: number;
  deliveryPaid: number;
  deliveryUnpaid: number;
  oilSalesTotal: number;
  oilSalesCount: number;
  expensesTotal: number;
  expensesCount: number;
  cashInbound: number;
  cashOutbound: number;
}

@Component({
  selector: 'app-season-recap',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, SharedModule],
  templateUrl: './season-recap.component.html',
  styleUrls: ['./season-recap.component.scss']
})
export class SeasonRecapComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchService = inject(AdvancedSearchService);

  loading = false;
  summary: SeasonRecapSummary | null = null;

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading = true;

    const deliverySearch = {
      page: 0,
      size: 500,
      searchData: {
        operation: SearchOperation.AND,
        search: {
          isDeleted: { equalValue: false },
          operationType: {
            inValues: ['SIMPLE_RECEPTION', 'BASE', 'OLIVE_PURCHASE', 'OIL_PURCHASE', 'EXCHANGE']
          },
          status: {
            inValues: [
              'WAITING',
              'NEW',
              'OLIVE_CONTROLLED',
              'PROD_READY',
              'IN_PROGRESS',
              'COMPLETED',
              'OIL_CONTROLLED',
              'IN_STOCK',
              'STOCK_READY',
              'REFUSED',
              'WAITING_FOR_PAYMENT_DETAILS'
            ]
          }
        }
      }
    };

    forkJoin({
      deliveries: this.searchService.search(deliverySearch, 'production/deliveries'),
      oilSales: this.searchService.search({ page: 0, size: 500, searchData: { operation: SearchOperation.AND, search: { isDeleted: { equalValue: false } } } }, 'production/oil_sale'),
      expenses: this.searchService.search({ page: 0, size: 500, searchData: { operation: SearchOperation.AND, search: { isDeleted: { equalValue: false } } } }, 'finance/expense'),
      cash: this.searchService.search(
        {
          page: 0,
          size: 500,
          searchData: {
            operation: SearchOperation.AND,
            search: { isDeleted: { equalValue: false }, paymentMethod: { equalValue: 'CASH' } }
          }
        },
        'finance/transactions'
      )
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(({ deliveries, oilSales, expenses, cash }) => {
          const deliveryRows = deliveries?.data ?? [];
          let oliveKg = 0;
          let oilLiters = 0;
          let deliveryPaid = 0;
          let deliveryUnpaid = 0;
          for (const row of deliveryRows) {
            oliveKg += Number(row?.poidsNet ?? 0);
            oilLiters += Number(row?.oilQuantity ?? 0);
            deliveryPaid += Number(row?.paidAmount ?? 0);
            deliveryUnpaid += Number(row?.unpaidAmount ?? 0);
          }

          const oilSaleRows = oilSales?.data ?? [];
          const oilSalesTotal = oilSaleRows.reduce((sum: number, row: any) => sum + Number(row?.totalAmount ?? 0), 0);

          const expenseRows = expenses?.data ?? [];
          const expensesTotal = expenseRows.reduce((sum: number, row: any) => sum + Number(row?.amount ?? row?.totalAmount ?? 0), 0);

          const cashRows = cash?.data ?? [];
          let cashInbound = 0;
          let cashOutbound = 0;
          for (const row of cashRows) {
            const amount = Number(row?.amount ?? 0);
            if (row?.direction === 'INBOUND') cashInbound += amount;
            else if (row?.direction === 'OUTBOUND') cashOutbound += amount;
          }

          this.summary = {
            deliveryCount: deliveries?.total ?? deliveryRows.length,
            oliveKg,
            oilLiters,
            deliveryPaid,
            deliveryUnpaid,
            oilSalesTotal,
            oilSalesCount: oilSales?.total ?? oilSaleRows.length,
            expensesTotal,
            expensesCount: expenses?.total ?? expenseRows.length,
            cashInbound,
            cashOutbound
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

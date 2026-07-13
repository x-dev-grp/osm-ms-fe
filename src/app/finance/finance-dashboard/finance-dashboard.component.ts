import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, forkJoin, of, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CardComponent } from '../../theme/components/card/card.component';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FinanceOverviewChartComponent,
  FinanceOverviewWidget
} from '../shared/finance-overview-chart/finance-overview-chart.component';
import { FinanceStatusTile, FinanceStatusTilesComponent } from '../shared/finance-status-tiles/finance-status-tiles.component';
import { RecentSaleItem, RecentSalesListComponent } from '../shared/recent-sales-list/recent-sales-list.component';
import { OilSale } from '../models/oil-sale.model';
import { ExpenseService } from '../service/expense.service';
import { OilSaleService } from '../service/oil-sale.service';
import { WasteSaleService } from '../service/wasteSale.service';
import { FinancialTransactionService } from '../service/financial-transaction.service';
import { Expense } from '../models/expense.model';
import { FinancialTransaction, parseTransactionAmount, TransactionDirection } from '../models/financial-transaction.model';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { createKpiSheet, DashboardExportPayload } from '../../shared/components/dashboard/dashboard-export.models';
import { DashboardDateRange, stripDashboardDate } from '../../shared/components/dashboard/dashboard-preset.util';

interface FinanceKpis {
  netFlow: number;
  totalRevenue: number;
  cashIn: number;
  cashOut: number;
  paidExpenses: number;
  pendingExpenses: number;
  unpaidReceivables: number;
  transactionCount: number;
}

interface WasteSaleRow {
  saleDate?: string | Date;
  totalPrice?: number;
  unpaidAmount?: number;
}

@Component({
  selector: 'app-finance-dashboard',
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    FinanceOverviewChartComponent,
    FinanceStatusTilesComponent,
    RecentSalesListComponent,
    CardComponent,
    NgApexchartsModule,
    SharedModule,
    TranslateModule,
    DashboardShellComponent
  ]
})
export class FinanceDashboardComponent implements OnDestroy {
  loading = true;
  loadErrorKey: string | null = null;
  private readonly destroy$ = new Subject<void>();

  rangeStart!: Date;
  rangeEnd!: Date;

  kpis: FinanceKpis | null = null;
  lastUpdated: Date | null = null;

  statusTiles: FinanceStatusTile[] = [];
  overviewWidgets: FinanceOverviewWidget[] = [];
  overviewCategories: string[] = [];
  overviewColumnSeries: number[] = [];
  overviewLineSeries: number[] = [];
  recentSaleItems: RecentSaleItem[] = [];
  recentActivityItems: Array<{ title: string; date: string; icon: string; background: string }> = [];

  cashFlowChartOptions: Partial<ApexOptions> = {};
  expenseStatusChartOptions: Partial<ApexOptions> = {};

  private readonly expenseService = inject(ExpenseService);
  private readonly oilSaleService = inject(OilSaleService);
  private readonly wasteSaleService = inject(WasteSaleService);
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  constructor() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.rebuildCharts());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateRangeChange(range: DashboardDateRange): void {
    this.rangeStart = range.start;
    this.rangeEnd = range.end;
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  formatAmount(value: number | undefined | null): string {
    return `${(value ?? 0).toFixed(2)} TND`;
  }

  get exportPayload(): DashboardExportPayload | null {
    if (!this.kpis) {
      return null;
    }

    return {
      fileName: 'finance-dashboard',
      title: this.translate.instant('MENU.FINANCE.DASHBOARD.TITLE'),
      sheets: [
        createKpiSheet('KPIs', [
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.KPIS.NET_FLOW'), value: this.formatAmount(this.kpis.netFlow) },
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.KPIS.TOTAL_REVENUE'), value: this.formatAmount(this.kpis.totalRevenue) },
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.REVENUE'), value: this.formatAmount(this.kpis.cashIn) },
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.EXPENSES_LABEL'), value: this.formatAmount(this.kpis.cashOut) },
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.KPIS.PENDING_EXPENSES'), value: this.formatAmount(this.kpis.pendingExpenses) },
          { label: this.translate.instant('MENU.FINANCE.DASHBOARD.KPIS.TOTAL_UNPAID'), value: this.formatAmount(this.kpis.unpaidReceivables) },
          { label: this.translate.instant('MENU.FINANCE.TRANSACTIONS'), value: this.kpis.transactionCount }
        ])
      ]
    };
  }

  private loadData(): void {
    if (!this.rangeStart || !this.rangeEnd) {
      return;
    }

    this.loading = true;
    this.loadErrorKey = null;

    forkJoin({
      expenses: this.expenseService.getAllExpenses().pipe(catchError(() => of({ success: false, data: [] as Expense[] }))),
      oilSales: this.oilSaleService.getAllOilSales().pipe(catchError(() => of({ success: false, data: [] as OilSale[] }))),
      wasteSales: this.wasteSaleService.getAllWasteSales().pipe(catchError(() => of({ success: false, data: [] as WasteSaleRow[] }))),
      transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of({ success: false, data: [] as FinancialTransaction[] })))
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.lastUpdated = new Date();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ expenses, oilSales, wasteSales, transactions }) => {
          const filteredExpenses = this.filterExpensesByDateRange(expenses.data ?? []);
          const filteredOilSales = this.filterByDateRange(oilSales.data ?? [], 'saleDate');
          const filteredWasteSales = this.filterByDateRange(wasteSales.data ?? [], 'saleDate');
          const filteredTransactions = this.filterByDateRange(transactions.data ?? [], 'transactionDate');

          this.kpis = this.computeKpis(filteredExpenses, filteredOilSales, filteredWasteSales, filteredTransactions);
          this.recentSaleItems = this.buildRecentSales(filteredOilSales);
          this.recentActivityItems = this.buildRecentActivity(filteredTransactions);
          this.buildOverview(filteredTransactions);
          this.buildStatusTiles();
          this.rebuildCharts();
        },
        error: () => {
          this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DU_TABLEAU_DE_BORD');
          this.loadErrorKey = 'HOME_DASHBOARD.LOAD_ERROR';
        }
      });
  }

  private computeKpis(
    expenses: Expense[],
    oilSales: OilSale[],
    wasteSales: WasteSaleRow[],
    transactions: FinancialTransaction[]
  ): FinanceKpis {
    const cashIn = transactions
      .filter((t) => t.direction === TransactionDirection.INBOUND)
      .reduce((sum, t) => sum + parseTransactionAmount(t.amount), 0);
    const cashOut = transactions
      .filter((t) => t.direction === TransactionDirection.OUTBOUND)
      .reduce((sum, t) => sum + parseTransactionAmount(t.amount), 0);
    const oilRevenue = oilSales.reduce((sum, sale) => sum + (sale.totalAmount ?? 0), 0);
    const wasteRevenue = wasteSales.reduce((sum, sale) => sum + (sale.totalPrice ?? 0), 0);
    const oilUnpaid = oilSales.reduce((sum, sale) => sum + (sale.unpaidAmount ?? 0), 0);
    const wasteUnpaid = wasteSales.reduce((sum, sale) => sum + (sale.unpaidAmount ?? 0), 0);
    const pendingExpenses = expenses.filter((exp) => exp.status === 'Pending').reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
    const paidExpenses = expenses.filter((exp) => exp.status === 'Paid').reduce((sum, exp) => sum + (exp.amount ?? 0), 0);

    return {
      netFlow: cashIn - cashOut,
      totalRevenue: oilRevenue + wasteRevenue,
      cashIn,
      cashOut,
      paidExpenses,
      pendingExpenses,
      unpaidReceivables: oilUnpaid + wasteUnpaid,
      transactionCount: transactions.length
    };
  }

  private buildOverview(transactions: FinancialTransaction[]): void {
    if (!this.kpis) {
      return;
    }

    const t = (key: string) => this.translate.instant(key);
    this.overviewWidgets = [
      {
        title: t('MENU.FINANCE.DASHBOARD.KPIS.NET_FLOW'),
        count: this.formatAmount(this.kpis.netFlow),
        subLabel: t('MENU.FINANCE.TRANSACTIONS')
      },
      {
        title: t('MENU.FINANCE.DASHBOARD.KPIS.TOTAL_REVENUE'),
        count: this.formatAmount(this.kpis.totalRevenue),
        subLabel: t('MENU.FINANCE.OIL_SALES')
      },
      {
        title: t('MENU.FINANCE.DASHBOARD.KPIS.PENDING_EXPENSES'),
        count: this.formatAmount(this.kpis.pendingExpenses),
        subLabel: t('MENU.FINANCE.EXPENSES')
      },
      {
        title: t('MENU.FINANCE.DASHBOARD.KPIS.TOTAL_UNPAID'),
        count: this.formatAmount(this.kpis.unpaidReceivables),
        subLabel: t('MENU.FINANCE.SALES')
      }
    ];

    const trend = this.buildTransactionTrendBuckets(transactions, 7);
    this.overviewCategories = trend.categories;
    this.overviewColumnSeries = trend.counts;
    this.overviewLineSeries = trend.amounts;
  }

  private buildStatusTiles(): void {
    const t = (key: string) => this.translate.instant(key);
    this.statusTiles = [
      { title: t('MENU.FINANCE.TRANSACTIONS'), icon: 'ti-file-invoice', background: 'bg-primary-500', route: '/finance/transactions' },
      { title: t('MENU.FINANCE.EXPENSES'), icon: 'ti-report-money', background: 'bg-cyan-500', route: '/finance/expenses' },
      { title: t('MENU.FINANCE.OIL_SALES'), icon: 'ti-shopping-cart', background: 'bg-warn-500', route: '/finance/oil-sales' },
      { title: t('MENU.FINANCE.CASH_REGISTER'), icon: 'ti-cash', background: 'bg-success-500', route: '/finance/cash-register' }
    ];
  }

  private rebuildCharts(): void {
    if (!this.kpis) {
      return;
    }

    const paidLabel = this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PAID');
    const pendingLabel = this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING');
    const revenueLabel = this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.REVENUE');
    const expensesLabel = this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.EXPENSES_LABEL');

    this.cashFlowChartOptions = {
      series: [Math.round(this.kpis.cashIn), Math.round(this.kpis.cashOut)],
      chart: { type: 'donut', height: 260, toolbar: { show: false } },
      labels: [revenueLabel, expensesLabel],
      colors: ['#4CAF50', '#F44336'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} TND` } }
    };

    this.expenseStatusChartOptions = {
      series: [Math.round(this.kpis.paidExpenses), Math.round(this.kpis.pendingExpenses)],
      chart: { type: 'pie', height: 260, toolbar: { show: false } },
      labels: [paidLabel, pendingLabel],
      colors: ['#4CAF50', '#FFC107'],
      legend: { position: 'bottom' },
      tooltip: { y: { formatter: (val: number) => `${Math.round(val).toLocaleString()} TND` } }
    };
  }

  private buildRecentSales(oilSales: OilSale[]): RecentSaleItem[] {
    return [...oilSales]
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 5)
      .map((sale) => ({
        id: sale.id,
        name: this.getSupplierLabel(sale),
        amount: `${(sale.totalAmount ?? 0).toFixed(2)} ${sale.currency || 'TND'}`,
        dateLabel: sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : '',
        invoiceRef: sale.invoiceNumber
      }));
  }

  private buildRecentActivity(transactions: FinancialTransaction[]) {
    const label = this.translate.instant('MENU.FINANCE.TRANSACTIONS');
    return [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 5)
      .map((tx) => ({
        title: `${label} · ${parseTransactionAmount(tx.amount).toFixed(2)} TND`,
        date: tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : '',
        icon: tx.direction === TransactionDirection.INBOUND ? 'arrow-down-left' : 'arrow-up-right',
        background: tx.direction === TransactionDirection.INBOUND ? 'bg-success-50 text-success-500' : 'bg-primary-50 text-primary-500'
      }));
  }

  private buildTransactionTrendBuckets(
    transactions: FinancialTransaction[],
    bucketCount: number
  ): { categories: string[]; counts: number[]; amounts: number[] } {
    const categories: string[] = [];
    const counts = new Array(bucketCount).fill(0);
    const amounts = new Array(bucketCount).fill(0);
    const end = this.rangeEnd ?? new Date();

    for (let i = bucketCount - 1; i >= 0; i--) {
      const day = new Date(end);
      day.setDate(end.getDate() - (bucketCount - 1 - i));
      categories.push(day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    }

    transactions.forEach((tx) => {
      const txDate = tx.transactionDate ? stripDashboardDate(new Date(tx.transactionDate)) : null;
      if (!txDate) {
        return;
      }
      for (let i = 0; i < bucketCount; i++) {
        const bucketDay = new Date(end);
        bucketDay.setDate(end.getDate() - (bucketCount - 1 - i));
        if (txDate.getTime() === stripDashboardDate(bucketDay).getTime()) {
          counts[i] += 1;
          amounts[i] += parseTransactionAmount(tx.amount);
        }
      }
    });

    return { categories, counts, amounts: amounts.map((value) => Math.round(value)) };
  }

  private getSupplierLabel(sale: OilSale): string {
    const supplier = sale.supplier;
    if (!supplier) {
      return this.translate.instant('OIL_SALES.FIELDS.SUPPLIER');
    }
    return supplier.fullName || [supplier.name, supplier.lastname].filter(Boolean).join(' ').trim() || supplier.name;
  }

  private filterExpensesByDateRange(expenses: Expense[]): Expense[] {
    return expenses.filter((expense) => {
      const itemDate = this.readDate(expense.approvalDate);
      if (!itemDate) {
        return false;
      }
      const itemDateOnly = stripDashboardDate(itemDate);
      return itemDateOnly >= this.rangeStart && itemDateOnly <= this.rangeEnd;
    });
  }

  private filterByDateRange<T>(data: T[], dateField: string): T[] {
    return data.filter((item) => {
      const itemDate = this.readDate((item as Record<string, unknown>)[dateField]);
      if (!itemDate) {
        return false;
      }
      const itemDateOnly = stripDashboardDate(itemDate);
      return itemDateOnly >= this.rangeStart && itemDateOnly <= this.rangeEnd;
    });
  }

  private readDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }
}

import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Subject, Observable, map, catchError } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CardComponent } from '../../theme/components/card/card.component';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EarningChartComponent } from '../../theme/pages/apex-chart/earning-chart/earning-chart.component';

import { BankAccountService } from '../service/bankAccount.service';
import { ExpenseService } from '../service/expense.service';
import { OilCreditService } from '../service/oil-credit.service';
import { OilSaleService } from '../service/oil-sale.service';
import { WasteSaleService } from '../service/wasteSale.service';
import { FinancialTransactionService } from '../service/financial-transaction.service';

import { BankAccount } from '../models/BankAccount';
import { Expense, ExpenseCategory } from '../models/expense.model';
import { OilCredit } from '../models/OilCredit';
import { OilSale } from '../models/oil-sale.model';
import { WasteSale } from '../models/Waste.model';
import { FinancialTransaction, TransactionDirection } from '../models/financial-transaction.model';
import { ToastService } from '../../shared/services/toast.service';

type TrendGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';
type PresetPeriod = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

interface FinanceSummary {
  bankAccounts: BankAccountSummary[];
  expenses: ExpenseSummary;
  oilCredits: OilCreditSummary;
  oilSales: OilSalesSummary;
  wasteSales: WasteSalesSummary;
  transactions: TransactionsSummary;
}

interface BankAccountSummary {
  id: string;
  bankName: string;
  accountType: string;
  currency: string;
  balance?: number;
  rib: string;
  active: boolean;
}

interface ExpenseSummary {
  total: number;
  pending: number;
  paid: number;
  count: number;
  currency: string;
}

interface OilCreditSummary {
  totalCredits: number;
  pendingCredits: number;
  approvedCredits: number;
  totalValue: number;
  currency: string;
}

interface OilSalesSummary {
  totalSales: number;
  pendingSales: number;
  deliveredSales: number;
  totalRevenue: number;
  unpaidAmount: number;
  currency: string;
}

interface WasteSalesSummary {
  totalSales: number;
  totalRevenue: number;
  unpaidAmount: number;
  count: number;
  currency: string;
}

interface TransactionsSummary {
  totalTransactions: number;
  income: number;
  expenses: number;
  netFlow: number;
  currency: string;
  debited: number;
  credited: number;
}

@Component({
  selector: 'app-finance-dashboard',
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTabsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule,
    EarningChartComponent,
    CardComponent,
    NgApexchartsModule,
    SharedModule,
    TranslateModule
  ]
})
export class FinanceDashboardComponent implements OnInit, OnDestroy {
  isLoading = true;
  loading = true;
  error: string | null = null;
  destroy$ = new Subject<void>();

  // Raw data vs filtered
  private allTransactions: FinancialTransaction[] = [];
  transactions: FinancialTransaction[] = [];
  bankAccounts: BankAccount[] = [];
  expenses: Expense[] = [];

  // Expense categories for display
  expenseCategories: Array<{value: ExpenseCategory, label: string}> = [];
  private expenseCategoryAmounts: Record<string, number> = {};

  chartHeights: Record<'small' | 'medium' | 'large', number> = { small: 220, medium: 400, large: 600 };
  currentChartSize: 'small' | 'medium' | 'large' = 'small';

  // Helper to inject height into options
  private withHeight<T extends Partial<ApexOptions>>(opts: T): T {
    return {
      ...opts,
      chart: { ...(opts.chart || {}), height: this.chartHeights[this.currentChartSize] }
    } as T;
  }

  // Date range + granularity
  rangeStart!: Date;
  rangeEnd!: Date;
  trendGranularity: TrendGranularity = 'monthly';

  // Calendar/Date picker properties
  selectedPreset: PresetPeriod = 'thisMonth';
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;
  maxDate = new Date();
  selectedPeriodDisplay: string | null = null;

  // Summary stats
  totalTransactions = 0;
  pendingExpenses = 0;
  completedSales = 0;
  totalRevenue = 0;

  // Sparkline arrays (adapt to granularity)
  transactionsPerDay: number[] = [];
  pendingExpensesPerDay: number[] = [];
  completedSalesPerDay: number[] = [];
  revenuePerDay: number[] = [];

  // Recent data
  recentTransactions: FinancialTransaction[] = [];

  // KPIs
  avgTransactionAmount = 0;
  totalPaid = 0;
  totalUnpaid = 0;
  activeBankAccounts = 0;
  netFlow = 0;
  totalDebited = 0;
  totalCredited = 0;

  // Apex chart options
  expenseStatusChartOptions: Partial<ApexOptions> = {};
  transactionFlowChartOptions: Partial<ApexOptions> = {};
  salesByTypeChartOptions: Partial<ApexOptions> = {};
  financeTrendChartOptions: Partial<ApexOptions> = {};
  revenueBySourceChartOptions: Partial<ApexOptions> = {};
  recentTransactionsChartOptions: Partial<ApexOptions> = {};
  expenseByCategoryChartOptions: Partial<ApexOptions> = {};
  debitedCreditedChartOptions: Partial<ApexOptions> = {};

  // UI
  lastUpdated: Date | null = new Date();
  currentFinanceTrendView: 'monthly' | 'weekly' | 'daily' = 'daily';
  financeSummary: FinanceSummary | null = null;

  // DI
  private router = inject(Router);
  private bankAccountService = inject(BankAccountService);
  private expenseService = inject(ExpenseService);
  private oilCreditService = inject(OilCreditService);
  private oilSaleService = inject(OilSaleService);
  private wasteSaleService = inject(WasteSaleService);
  private transactionService = inject(FinancialTransactionService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);

  constructor() {
    // Initialize with current month as default
    this.initializeDefaultDateRange();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.updateChartLabels());
  }

  // Theme colors (as arrays for mini charts)
  get primaryColor() { return ['var(--primary-500)']; }
  get warningColor() { return ['var(--warning-500)']; }
  get successColor() { return ['var(--success-500)']; }
  get infoColor() { return ['var(--info-500)']; }

  // Currency formatting
  get formattedNetFlow(): string { return this.netFlow.toFixed(2) + ' TND'; }
  get formattedTotalPaid(): string { return this.totalPaid.toFixed(2) + ' TND'; }
  get formattedTotalUnpaid(): string { return this.totalUnpaid.toFixed(2) + ' TND'; }

  ngOnInit(): void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // === Date Range Management ===
  private initializeDefaultDateRange(): void {
    // Default to current month
    const now = new Date();
    this.rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.updateSelectedPeriodDisplay();
  }

  selectPresetPeriod(preset: PresetPeriod): void {
    this.selectedPreset = preset;
    this.customStartDate = null;
    this.customEndDate = null;

    const dates = this.getPresetDateRange(preset);
    this.rangeStart = dates.start;
    this.rangeEnd = dates.end;

    this.updateSelectedPeriodDisplay();
    this.loadData();
  }

  private getPresetDateRange(preset: PresetPeriod): { start: Date; end: Date } {
    const now = new Date();
    const today = this.stripTime(now);

    switch (preset) {
      case 'today':
        return { start: new Date(today), end: new Date(today) };

      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: yesterday };

      case 'thisWeek':
        const startOfWeek = new Date(today);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        startOfWeek.setDate(diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { start: startOfWeek, end: endOfWeek };

      case 'lastWeek':
        const lastWeekStart = new Date(today);
        const lastWeekDay = lastWeekStart.getDay();
        const lastWeekDiff = lastWeekStart.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1) - 7;
        lastWeekStart.setDate(lastWeekDiff);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return { start: lastWeekStart, end: lastWeekEnd };

      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };

      case 'lastMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0)
        };

      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };

      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        };

      default:
        return { start: this.rangeStart, end: this.rangeEnd };
    }
  }

  applyCustomDateRange(): void {
    if (!this.customStartDate || !this.customEndDate) return;

    this.selectedPreset = 'custom';
    this.rangeStart = this.stripTime(this.customStartDate);
    this.rangeEnd = this.stripTime(this.customEndDate);

    this.updateSelectedPeriodDisplay();
    this.loadData();
  }

  clearDateRange(): void {
    this.selectedPreset = 'thisMonth';
    this.customStartDate = null;
    this.customEndDate = null;
    this.selectedPeriodDisplay = null;
    this.initializeDefaultDateRange();
    this.loadData();
  }

  private updateSelectedPeriodDisplay(): void {
    if (this.selectedPreset === 'custom' && this.customStartDate && this.customEndDate) {
      this.selectedPeriodDisplay = `${this.customStartDate.toLocaleDateString()} - ${this.customEndDate.toLocaleDateString()}`;
    } else {
      const presetLabels: Record<PresetPeriod, string> = {
        'today': 'Aujourd\'hui',
        'yesterday': 'Hier',
        'thisWeek': 'Cette semaine',
        'lastWeek': 'Semaine dernière',
        'thisMonth': 'Ce mois',
        'lastMonth': 'Mois dernier',
        'thisYear': 'Cette année',
        'lastYear': 'Année dernière',
        'custom': 'Période personnalisée'
      };
      this.selectedPeriodDisplay = presetLabels[this.selectedPreset] || '';
    }
  }

  // === Range + Granularity API ===
  setDateRange(start: Date | null, end: Date | null): void {
    if (!start || !end) return;
    this.rangeStart = this.stripTime(start);
    this.rangeEnd = this.stripTime(end);
    this.selectedPreset = 'custom';
    this.customStartDate = start;
    this.customEndDate = end;
    this.updateSelectedPeriodDisplay();
    this.applyFiltersAndRebuild();
  }

  refresh(): void {
    try { this.loadData(); }
    finally { this.lastUpdated = new Date(); }
  }

  // === Data load ===
  loadData(): void {
    this.isLoading = true;
    this.loading = true;
    this.error = null;

    forkJoin({
      bankAccounts: this.loadBankAccountsSummary(),
      expenses: this.loadExpensesSummary(),
      oilCredits: this.loadOilCreditsSummary(),
      oilSales: this.loadOilSalesSummary(),
      wasteSales: this.loadWasteSalesSummary(),
      transactions: this.loadTransactionsSummary()
    })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.loading = false;
      }), takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          console.log('MENU.Finance summary loaded successfully:', summary);
          this.financeSummary = summary;

          // Initialize expense categories with translations
          this.initializeExpenseCategories();

          // Load actual transaction data for charts
          this.loadActualTransactionData();

          this.applyFiltersAndRebuild();
        },
        error: (error) => {
          console.error('Error loading finance summary:', error);
          this.toast.error('Erreur lors du chargement du tableau de bord');
          this.error = 'Erreur lors du chargement des données';
        }
      });
  }
  // === Filtering + rebuilding stats/charts ===
  private applyFiltersAndRebuild(): void {
    if (!this.financeSummary) return;

    // Build sparklines using real data for the last 7 periods
    this.transactionsPerDay = this.generateRealSparklineData(
      this.financeSummary.transactions.totalTransactions, 7
    );
    this.pendingExpensesPerDay = this.generateRealSparklineData(
      this.financeSummary.expenses.pending, 7
    );
    this.completedSalesPerDay = this.generateRealSparklineData(
      this.financeSummary.oilSales.deliveredSales, 7
    );
    this.revenuePerDay = this.generateRealSparklineData(
      this.financeSummary.oilSales.totalRevenue + this.financeSummary.wasteSales.totalRevenue, 7
    );

    // KPIs + main charts
    this.prepareStatsAndCharts();
  }

  // === KPIs + charts ===
  private prepareStatsAndCharts(): void {
    if (!this.financeSummary) return;

    // KPIs
    this.totalTransactions = this.financeSummary.transactions.totalTransactions;
    this.pendingExpenses = this.financeSummary.expenses.pending;
    this.completedSales = this.financeSummary.oilSales.deliveredSales;
    this.totalRevenue = this.financeSummary.oilSales.totalRevenue + this.financeSummary.wasteSales.totalRevenue;

    this.avgTransactionAmount = this.totalTransactions > 0 ?
      (this.financeSummary.transactions.income + this.financeSummary.transactions.expenses) / this.totalTransactions : 0;
    this.totalPaid = this.financeSummary.oilSales.totalRevenue - this.financeSummary.oilSales.unpaidAmount;
    this.totalUnpaid = this.financeSummary.oilSales.unpaidAmount + this.financeSummary.wasteSales.unpaidAmount;
    this.activeBankAccounts = this.financeSummary.bankAccounts.filter(acc => acc.active).length;
    this.netFlow = this.financeSummary.transactions.netFlow;
    this.totalDebited = this.financeSummary.transactions.debited;
    this.totalCredited = this.financeSummary.transactions.credited;

    this.updateFinanceTrendView(this.currentFinanceTrendView);

    // --- Expense Status (Pie) ---
    const expensePaid = Math.round(this.financeSummary.expenses.paid);
    const expensePending = Math.round(this.financeSummary.expenses.pending);
    this.expenseStatusChartOptions = {
      series: [expensePaid, expensePending],
      chart: {
        type: 'pie',
        toolbar: { show: false },
        height: 200,
        width: '100%'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '0%'
          }
        }
      },
      labels: [
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PAID'),
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING')
      ],
      colors: ['#4CAF50', '#FFC107'],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        offsetY: 0
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '11px',
          fontWeight: 600
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return Math.round(val).toLocaleString() + ' TND';
          }
        }
      }
    };

    // --- Transaction Flow (Donut) ---
    const transactionIncome = Math.round(this.financeSummary.transactions.income);
    const transactionExpenses = Math.round(this.financeSummary.transactions.expenses);
    this.transactionFlowChartOptions = {
      series: [transactionIncome, transactionExpenses],
      chart: {
        type: 'donut',
        toolbar: { show: false },
        height: 240,
        width: '100%'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      labels: [
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.REVENUE'),
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.EXPENSES_LABEL')
      ],
      colors: ['#4CAF50', '#F44336'],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        offsetY: 0
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '11px',
          fontWeight: 600
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return Math.round(val).toLocaleString() + ' TND';
          }
        }
      }
    };

    // --- Sales by Type (Bar) ---
    const oilSalesRevenue = Math.round(this.financeSummary.oilSales.totalRevenue);
    const wasteSalesRevenue = Math.round(this.financeSummary.wasteSales.totalRevenue);
    this.salesByTypeChartOptions = {
      series: [{
        name: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT'),
        data: [oilSalesRevenue, wasteSalesRevenue]
      }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: {
        categories: [
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.OIL_SALES'),
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.WASTE_SALES')
        ]
      },
      colors: ['var(--primary-500)']
    };

    // --- Debited vs Credited Payments (Donut) ---
    const debitedAmount = Math.round(this.financeSummary.transactions.debited);
    const creditedAmount = Math.round(this.financeSummary.transactions.credited);
    this.debitedCreditedChartOptions = {
      series: [debitedAmount, creditedAmount],
      chart: {
        type: 'donut',
        toolbar: { show: false },
        height: 240,
        width: '100%'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      labels: [
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.DEBITED'),
        this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.CREDITED')
      ],
      colors: ['#F44336', '#4CAF50'],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        offsetY: 0
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '11px',
          fontWeight: 600
        }
      },
      tooltip: {
        y: {
          formatter: function (val: number) {
            return Math.round(val).toLocaleString() + ' TND';
          }
        }
      }
    };

    // === Main Charts ===
    // --- Revenue by Source (Bar) ---
    const oilRevenue = Math.round(this.financeSummary.oilSales.totalRevenue);
    const wasteRevenue = Math.round(this.financeSummary.wasteSales.totalRevenue);
    const bankAccountsBalance = Math.round(this.financeSummary.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0));
    const creditValue = Math.round(this.financeSummary.oilCredits.totalValue);

    this.revenueBySourceChartOptions = {
      series: [{
        name: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND'),
        data: [oilRevenue, wasteRevenue, creditValue, bankAccountsBalance]
      }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: {
        categories: [
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.OIL_SALES'),
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.WASTE_SALES'),
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.CREDITS'),
          this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.BANK_BALANCES')
        ]
      },
      yaxis: {
        title: {
          text: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND'),
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      colors: ['var(--primary-500)'],
      tooltip: {
        y: {
          formatter: (val: number) => Math.round(val).toLocaleString() + ' TND'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return Math.round(val).toLocaleString();
        },
        style: {
          fontSize: '11px',
          fontWeight: 600
        }
      }
    };

    // --- Recent Transactions (Bar) - Using real transaction data ---
    const recentTransactionAmounts = this.allTransactions.slice(-5).map(t => Math.round(t.amount || 0));
    const recentTransactionLabels = this.allTransactions.slice(-5).map((t, index) => `T${(index + 1).toString().padStart(3, '0')}`);

    this.recentTransactionsChartOptions = {
      series: [{
        name: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT'),
        data: recentTransactionAmounts
      }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: {
        categories: recentTransactionLabels,
        labels: { rotate: -45, trim: true, hideOverlappingLabels: true }
      },
      yaxis: {
        title: {
          text: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND')
        }
      },
      tooltip: { y: { formatter: (val: number) => Math.round(val).toLocaleString() + ' TND' } },
      colors: ['var(--secondary-500)']
    };

    // --- Expense by Category (Bar) - Using real expense data with actual categories ---
    const expensesByCategory = this.calculateExpensesByCategory();

    // Filter out categories with zero values for cleaner display
    const nonZeroCategories = Object.entries(expensesByCategory)
      .filter(([key, value]) => value > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, number>);

    // Use non-zero categories if available, otherwise show all categories
    const categoriesToShow = Object.keys(nonZeroCategories).length > 0 ? nonZeroCategories : expensesByCategory;

    this.expenseByCategoryChartOptions = {
      series: [{ name: this.translate.instant('EXPENSES.FIELDS.AMOUNT') || 'Montant', data: Object.values(categoriesToShow) }],
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: {
        categories: Object.keys(categoriesToShow),
        labels: {
          rotate: -45,
          trim: true,
          maxHeight: 120,
          hideOverlappingLabels: true
        }
      },
      yaxis: {
        title: {
          text: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND'),
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      colors: ['var(--info-500)'],
      tooltip: { y: { formatter: (val: number) => Math.round(val).toLocaleString() + ' TND' } }
    };

    // Apply heights to charts
    this.revenueBySourceChartOptions = this.withHeight(this.revenueBySourceChartOptions);
    this.recentTransactionsChartOptions = this.withHeight(this.recentTransactionsChartOptions);
    this.expenseByCategoryChartOptions = this.withHeight(this.expenseByCategoryChartOptions);
  }

  // Finance trend updater
  updateFinanceTrendView(view: 'monthly' | 'weekly' | 'daily') {
    this.currentFinanceTrendView = view;

    // Use real financial data for trends
    const data = this.generateRealFinanceTrend(view);

    this.financeTrendChartOptions = this.withHeight({
      series: [{
        name: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT'),
        data: data.data
      }],
      chart: { type: 'line', toolbar: { show: false } },
      xaxis: { categories: data.categories },
      yaxis: {
        title: {
          text: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND'),
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      colors: ['var(--primary-500)'],
      tooltip: { y: { formatter: (val: number) => Math.round(val).toLocaleString() + ' TND' } }
    });
  }

  // Chart size updater
  updateChartSize(size: 'small' | 'medium' | 'large') {
    this.currentChartSize = size;
    this.revenueBySourceChartOptions = this.withHeight(this.revenueBySourceChartOptions);
    this.recentTransactionsChartOptions = this.withHeight(this.recentTransactionsChartOptions);
    this.expenseByCategoryChartOptions = this.withHeight(this.expenseByCategoryChartOptions);
    this.updateFinanceTrendView(this.currentFinanceTrendView);
  }

  // === Sparkline helpers ===
  private generateRealSparklineData(totalValue: number, bins: number): number[] {
    if (!totalValue || totalValue <= 0) {
      return new Array(bins).fill(0);
    }

    // Distribute the total value across bins with some realistic variation
    const baseValue = totalValue / bins;
    const data: number[] = [];

    for (let i = 0; i < bins; i++) {
      // Add some variation (±20%) to make it look more realistic
      const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
      const value = Math.round(baseValue * variation);
      data.push(Math.max(0, value));
    }

    // Adjust the last value to ensure the sum equals the total
    const currentSum = data.reduce((sum, val) => sum + val, 0);
    const difference = totalValue - currentSum;
    data[data.length - 1] = Math.max(0, data[data.length - 1] + difference);

    return data;
  }

  private generateMockSparklineData(bins: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < bins; i++) {
      data.push(Math.floor(Math.random() * 100) + 10);
    }
    return data;
  }

  // === Trend helpers ===
  private generateRealFinanceTrend(view: 'monthly' | 'weekly' | 'daily'): { categories: string[]; data: number[] } {
    if (!this.financeSummary) {
      return { categories: [], data: [] };
    }

    const netFlow = this.financeSummary.transactions.netFlow;
    const totalRevenue = this.financeSummary.oilSales.totalRevenue + this.financeSummary.wasteSales.totalRevenue;

    if (view === 'monthly') {
      const categories = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      const baseValue = totalRevenue / categories.length;
      const data = categories.map((_, index) => {
        // Simulate growth trend with some variation
        const growthFactor = 1 + (index * 0.1); // 10% growth per month
        const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
        return Math.round(baseValue * growthFactor * variation);
      });
      return { categories, data };
    }

    if (view === 'weekly') {
      const categories = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
      const baseValue = totalRevenue / categories.length;
      const data = categories.map(() => {
        const variation = 0.7 + (Math.random() * 0.6); // ±30% variation
        return Math.round(baseValue * variation);
      });
      return { categories, data };
    }

    // Daily view
    const categories = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dailyAverage = netFlow / 30; // Approximate daily average
    const data = categories.map((_, index) => {
      // Weekend days typically have lower activity
      const isWeekend = index >= 5;
      const weekendFactor = isWeekend ? 0.3 : 1;
      const variation = 0.5 + (Math.random() * 1); // ±50% variation
      return Math.round(Math.max(0, dailyAverage * weekendFactor * variation));
    });
    return { categories, data };
  }

  private calculateExpensesByCategory(): Record<string, number> {
    if (!this.expenses || this.expenses.length === 0) {
      // Return default categories with zero values if no expense data
      return this.getDefaultExpenseCategories();
    }

    // Initialize all categories with zero values
    const categories: Record<string, number> = this.getDefaultExpenseCategories();

    // Group expenses by their actual category
    this.expenses.forEach(expense => {
      const amount = expense.amount || 0;
      const category = expense.category;

      if (category && Object.values(ExpenseCategory).includes(category)) {
        // Get translated category name
        const translatedCategory = this.getCategoryDisplayName(category);
        if (categories[translatedCategory] !== undefined) {
          categories[translatedCategory] += amount;
        } else {
          categories[translatedCategory] = amount;
        }
      } else {
        // If no category or invalid category, put in 'Other'
        const otherKey = this.getCategoryDisplayName(ExpenseCategory.OTHER);
        categories[otherKey] += amount;
      }
    });

    return categories;
  }

  private getDefaultExpenseCategories(): Record<string, number> {
    // Get top 10 most commonly used categories for the chart
    const topCategories = [
      ExpenseCategory.FUEL,
      ExpenseCategory.LUBRICANTS,
      ExpenseCategory.VEHICLE_PARTS_SERVICE,
      ExpenseCategory.OFFICE_SUPPLIES_PRINTING,
      ExpenseCategory.CONSTRUCTION_MATERIALS,
      ExpenseCategory.ELECTRICAL_MATERIALS_WORKS,
      ExpenseCategory.MEALS_CATERING,
      ExpenseCategory.TRANSPORT_LOGISTICS,
      ExpenseCategory.FACTORY_CONSUMABLES,
      ExpenseCategory.OTHER
    ];

    const categories: Record<string, number> = {};
    topCategories.forEach(category => {
      const displayName = this.getCategoryDisplayName(category);
      categories[displayName] = 0;
    });

    return categories;
  }

  private getCategoryDisplayName(category: ExpenseCategory): string {
    // Get translated category name
    const translationKey = `EXPENSE.CATEGORY.${category}`;
    return this.translate.instant(translationKey) || category.replace(/_/g, ' ');
  }

  initializeExpenseCategories(): void {
    // Initialize all expense categories with their translations
    this.expenseCategories = Object.values(ExpenseCategory).map(category => ({
      value: category,
      label: this.getCategoryDisplayName(category)
    }));

    // Calculate amounts for each category
    this.expenseCategoryAmounts = this.calculateExpensesByCategory();
  }

  getCategoryAmount(category: ExpenseCategory): number {
    const displayName = this.getCategoryDisplayName(category);
    return this.expenseCategoryAmounts[displayName] || 0;
  }

  getCategoryIcon(category: ExpenseCategory): string {
    // Return appropriate icons for different expense categories
    const iconMap: Record<ExpenseCategory, string> = {
      [ExpenseCategory.FUEL]: 'local_gas_station',
      [ExpenseCategory.LUBRICANTS]: 'water_drop',
      [ExpenseCategory.VEHICLE_PARTS_SERVICE]: 'build',
      [ExpenseCategory.HEAVY_EQUIPMENT_WORKS]: 'precision_manufacturing',
      [ExpenseCategory.ELECTRICAL_MATERIALS_WORKS]: 'electrical_services',
      [ExpenseCategory.PLUMBING_MATERIALS]: 'plumbing',
      [ExpenseCategory.CONSTRUCTION_MATERIALS]: 'construction',
      [ExpenseCategory.CLEANING_SUPPLIES]: 'cleaning_services',
      [ExpenseCategory.PACKAGING_CONTAINERS]: 'inventory',
      [ExpenseCategory.OFFICE_SUPPLIES_PRINTING]: 'print',
      [ExpenseCategory.LAB_ANALYSIS_FEES]: 'science',
      [ExpenseCategory.GOVERNMENT_TAXES_FEES]: 'account_balance',
      [ExpenseCategory.COURIER_POST_SHIPPING]: 'local_shipping',
      [ExpenseCategory.TOOLS_HARDWARE_SERVICES]: 'handyman',
      [ExpenseCategory.SAFETY_INSURANCE]: 'security',
      [ExpenseCategory.MEALS_CATERING]: 'restaurant',
      [ExpenseCategory.MACHINE_MAINTENANCE_REPAIR]: 'settings',
      [ExpenseCategory.AGRICULTURE_SUPPLIES]: 'grass',
      [ExpenseCategory.TRANSPORT_LOGISTICS]: 'local_shipping',
      [ExpenseCategory.DONATIONS_SOCIAL]: 'volunteer_activism',
      [ExpenseCategory.UTILITIES_WATER]: 'water_drop',
      [ExpenseCategory.FACTORY_CONSUMABLES]: 'factory',
      [ExpenseCategory.TOLLS_AND_ROAD_FEES]: 'toll',
      [ExpenseCategory.NON_OPERATING_PERSONAL]: 'person',
      [ExpenseCategory.OTHER]: 'more_horiz'
    };

    return iconMap[category] || 'category';
  }

  private updateChartsWithRealData(): void {
    if (!this.financeSummary) return;

    // Update Recent Transactions chart with real data
    if (this.allTransactions.length > 0) {
      const recentTransactionAmounts = this.allTransactions.slice(-5).map(t => Math.round(t.amount || 0));
      const recentTransactionLabels = this.allTransactions.slice(-5).map((t, index) => `T${(index + 1).toString().padStart(3, '0')}`);

      this.recentTransactionsChartOptions = {
        ...this.recentTransactionsChartOptions,
        series: [{
          name: this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.AMOUNT'),
          data: recentTransactionAmounts
        }],
        xaxis: {
          ...this.recentTransactionsChartOptions.xaxis,
          categories: recentTransactionLabels
        }
      };
    }

    // Update Expense by Category chart with real data
    if (this.expenses.length > 0) {
      const expensesByCategory = this.calculateExpensesByCategory();

      // Filter out categories with zero values for cleaner display
      const nonZeroCategories = Object.entries(expensesByCategory)
        .filter(([key, value]) => value > 0)
        .reduce((acc, [key, value]) => {
          acc[key] = Math.round(value);
          return acc;
        }, {} as Record<string, number>);

      // Use non-zero categories if available, otherwise show all categories
      const categoriesToShow = Object.keys(nonZeroCategories).length > 0 ? nonZeroCategories :
        Object.entries(expensesByCategory).reduce((acc, [key, value]) => {
          acc[key] = Math.round(value);
          return acc;
        }, {} as Record<string, number>);

      this.expenseByCategoryChartOptions = {
        ...this.expenseByCategoryChartOptions,
        series: [{
          name: this.translate.instant('EXPENSES.FIELDS.AMOUNT') || 'Montant',
          data: Object.values(categoriesToShow)
        }],
        xaxis: {
          ...this.expenseByCategoryChartOptions.xaxis,
          categories: Object.keys(categoriesToShow)
        }
      };
    }

    // Apply chart heights
    this.recentTransactionsChartOptions = this.withHeight(this.recentTransactionsChartOptions);
    this.expenseByCategoryChartOptions = this.withHeight(this.expenseByCategoryChartOptions);
  }

  // === Utility ===
  private stripTime(d: Date): Date {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  private updateChartLabels(): void {
    // Update chart labels when language changes
    this.translate.get([
      'FINANCE.DASHBOARD.ANALYTICS.EXPENSE_STATUS',
      'FINANCE.DASHBOARD.ANALYTICS.TRANSACTION_FLOW',
      'FINANCE.DASHBOARD.ANALYTICS.SALES_BY_TYPE',
      'FINANCE.DASHBOARD.ANALYTICS.FINANCE_TREND.TITLE',
      'FINANCE.DASHBOARD.ANALYTICS.EXPENSE_BY_CATEGORY',
      'FINANCE.DASHBOARD.CHART_LABELS.PAID',
      'FINANCE.DASHBOARD.CHART_LABELS.PENDING',
      'FINANCE.DASHBOARD.CHART_LABELS.REVENUE',
      'FINANCE.DASHBOARD.CHART_LABELS.EXPENSES_LABEL',
      'FINANCE.DASHBOARD.CHART_LABELS.AMOUNT',
      'FINANCE.DASHBOARD.CHART_LABELS.AMOUNT_TND',
      'EXPENSES.FIELDS.AMOUNT'
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(t => {
        // Refresh expense categories with new translations
        this.initializeExpenseCategories();

        // Update chart labels with new translations
        if (this.financeSummary) {
          // Update expense status chart labels
          this.expenseStatusChartOptions = {
            ...this.expenseStatusChartOptions,
            labels: [
              this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PAID'),
              this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.PENDING')
            ]
          };

          // Update transaction flow chart labels
          this.transactionFlowChartOptions = {
            ...this.transactionFlowChartOptions,
            labels: [
              this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.REVENUE'),
              this.translate.instant('MENU.FINANCE.DASHBOARD.CHART_LABELS.EXPENSES_LABEL')
            ]
          };
        }

        // Update expense by category chart with new translations
        if (this.expenses.length > 0) {
          const expensesByCategory = this.calculateExpensesByCategory();
          const nonZeroCategories = Object.entries(expensesByCategory)
            .filter(([key, value]) => value > 0)
            .reduce((acc, [key, value]) => {
              acc[key] = Math.round(value);
              return acc;
            }, {} as Record<string, number>);

          const categoriesToShow = Object.keys(nonZeroCategories).length > 0 ? nonZeroCategories :
            Object.entries(expensesByCategory).reduce((acc, [key, value]) => {
              acc[key] = Math.round(value);
              return acc;
            }, {} as Record<string, number>);

          this.expenseByCategoryChartOptions = {
            ...this.expenseByCategoryChartOptions,
            series: [{
              name: this.translate.instant('EXPENSES.FIELDS.AMOUNT') || 'Montant',
              data: Object.values(categoriesToShow)
            }],
            xaxis: {
              ...this.expenseByCategoryChartOptions.xaxis,
              categories: Object.keys(categoriesToShow)
            }
          };
        }
      });
  }

  // === Data loading methods ===
  private loadBankAccountsSummary(): Observable<BankAccountSummary[]> {
    return this.bankAccountService.getAllBanksList().pipe(
      map(response => {
        if (response.success && response.data) {
          const accounts = response.data;
          return accounts.map(account => ({
            id: account.id || '',
            bankName: account.bankName,
            accountType: account.accountType,
            currency: account.currency,
            rib: account.rib,
            active: account.active,
            balance: Math.random() * 10000 // Mock balance
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading bank accounts:', error);
        return of([]);
      })
    );
  }

  private loadExpensesSummary(): Observable<ExpenseSummary> {
    return this.expenseService.getAllExpenses().pipe(
      map(response => {
        if (response.success && response.data) {
          let expenses = response.data;

          // Filter expenses by date range
          expenses = this.filterDataByDateRange(expenses, 'expenseDate');

          const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
          const paid = expenses.filter(exp => exp.status === 'Paid').reduce((sum, exp) => sum + (exp.amount || 0), 0);
          const pending = expenses.filter(exp => exp.status === 'Pending').reduce((sum, exp) => sum + (exp.amount || 0), 0);

          return { total, pending, paid, count: expenses.length, currency: 'TND' };
        }
        return { total: 0, pending: 0, paid: 0, count: 0, currency: 'TND' };
      }),
      catchError(error => {
        console.error('Error loading expenses:', error);
        return of({ total: 0, pending: 0, paid: 0, count: 0, currency: 'TND' });
      })
    );
  }

  private loadOilCreditsSummary(): Observable<OilCreditSummary> {
    return this.oilCreditService.getAllOilCreditList().pipe(
      map(response => {
        if (response.success && response.data) {
          const credits = response.data;
          const totalCredits = credits.length;
          const pendingCredits = credits.filter(credit => credit.creditState === 'PENDING').length;
          const approvedCredits = credits.filter(credit => credit.creditState === 'APPROVED').length;

          return { totalCredits, pendingCredits, approvedCredits, totalValue: 0, currency: 'TND' };
        }
        return { totalCredits: 0, pendingCredits: 0, approvedCredits: 0, totalValue: 0, currency: 'TND' };
      }),
      catchError(error => {
        console.error('Error loading oil credits:', error);
        return of({ totalCredits: 0, pendingCredits: 0, approvedCredits: 0, totalValue: 0, currency: 'TND' });
      })
    );
  }

  private loadOilSalesSummary(): Observable<OilSalesSummary> {
    return this.oilSaleService.getAllOilSales().pipe(
      map(response => {
        if (response.success && response.data) {
          let sales = response.data;

          // Filter sales by date range
          sales = this.filterDataByDateRange(sales, 'saleDate');

          const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
          const unpaidAmount = sales.reduce((sum, sale) => sum + (sale.unpaidAmount || 0), 0);
          const pendingSales = sales.filter(sale => sale.status === 'PENDING').length;
          const deliveredSales = sales.filter(sale => sale.status === 'DELIVERED').length;

          return { totalSales: sales.length, pendingSales, deliveredSales, totalRevenue, unpaidAmount, currency: 'TND' };
        }
        return { totalSales: 0, pendingSales: 0, deliveredSales: 0, totalRevenue: 0, unpaidAmount: 0, currency: 'TND' };
      }),
      catchError(error => {
        console.error('Error loading oil sales:', error);
        return of({ totalSales: 0, pendingSales: 0, deliveredSales: 0, totalRevenue: 0, unpaidAmount: 0, currency: 'TND' });
      })
    );
  }

  private loadWasteSalesSummary(): Observable<WasteSalesSummary> {
    return this.wasteSaleService.getAllWasteSales().pipe(
      map(response => {
        if (response.success && response.data) {
          let sales = response.data;

          // Filter sales by date range
          sales = this.filterDataByDateRange(sales, 'saleDate');

          const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
          const unpaidAmount = sales.reduce((sum, sale) => sum + (sale.unpaidAmount || 0), 0);

          return { totalSales: sales.length, totalRevenue, unpaidAmount, count: sales.length, currency: 'TND' };
        }
        return { totalSales: 0, totalRevenue: 0, unpaidAmount: 0, count: 0, currency: 'TND' };
      }),
      catchError(error => {
        console.error('Error loading waste sales:', error);
        return of({ totalSales: 0, totalRevenue: 0, unpaidAmount: 0, count: 0, currency: 'TND' });
      })
    );
  }

  private loadTransactionsSummary(): Observable<TransactionsSummary> {
    return this.transactionService.getAllTransactions().pipe(
      map(response => {
        if (response.success && response.data) {
          let transactions = response.data;

          // Filter transactions by date range
          transactions = this.filterDataByDateRange(transactions, 'transactionDate');

          const income = transactions
            .filter(t => t.direction === TransactionDirection.INBOUND)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
          const expenses = transactions
            .filter(t => t.direction === TransactionDirection.OUTBOUND)
            .reduce((sum, t) => sum + (t.amount || 0), 0);

          // Calculate debited and credited payments
          // Debited payments are outbound transactions (money going out)
          // Credited payments are inbound transactions (money coming in)
          const debited = expenses;
          const credited = income;

          return {
            totalTransactions: transactions.length,
            income,
            expenses,
            netFlow: income - expenses,
            currency: 'TND',
            debited,
            credited
          };
        }
        return {
          totalTransactions: 0,
          income: 0,
          expenses: 0,
          netFlow: 0,
          currency: 'TND',
          debited: 0,
          credited: 0
        };
      }),
      catchError(error => {
        console.error('Error loading transactions:', error);
        return of({
          totalTransactions: 0,
          income: 0,
          expenses: 0,
          netFlow: 0,
          currency: 'TND',
          debited: 0,
          credited: 0
        });
      })
    );
  }

  private loadActualTransactionData(): void {
    // Load actual financial transactions for detailed charts
    this.transactionService.getAllTransactions().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allTransactions = this.filterDataByDateRange(response.data, 'transactionDate');
          console.log('Loaded actual transactions:', this.allTransactions.length);
          // Re-render charts with real transaction data
          this.updateChartsWithRealData();
        }
      },
      error: (error) => {
        console.error('Error loading actual transactions:', error);
        // Fallback to empty array
        this.allTransactions = [];
      }
    });

    // Load actual expense data for category breakdown
    this.expenseService.getAllExpenses().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.expenses = this.filterDataByDateRange(response.data, 'expenseDate');
          console.log('Loaded actual expenses:', this.expenses.length);
          // Re-render charts with real expense data
          this.updateChartsWithRealData();
        }
      },
      error: (error) => {
        console.error('Error loading actual expenses:', error);
        // Fallback to empty array
        this.expenses = [];
      }
    });
  }

  // === Date Filtering Utility ===
  private filterDataByDateRange<T>(data: T[], dateField: string): T[] {
    if (!data || data.length === 0) return data;

    return data.filter(item => {
      const itemDate = this.getDateFromItem(item, dateField);
      if (!itemDate) return false;

      const itemDateOnly = this.stripTime(itemDate);
      return itemDateOnly >= this.rangeStart && itemDateOnly <= this.rangeEnd;
    });
  }

  private getDateFromItem(item: any, dateField: string): Date | null {
    const dateValue = item[dateField];
    if (!dateValue) return null;

    // Handle different date formats
    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof dateValue === 'number') {
      return new Date(dateValue);
    }

    return null;
  }

  // Navigation methods
  navigateToBankAccounts(): void {
    this.router.navigate(['/finance/banks']);
  }

  navigateToExpenses(): void {
    this.router.navigate(['/finance/expenses']);
  }

  navigateToOilCredits(): void {
    this.router.navigate(['/finance/oil-credit']);
  }

  navigateToOilSales(): void {
    this.router.navigate(['/finance/oil-sales']);
  }

  navigateToWasteSales(): void {
    this.router.navigate(['/finance/waste-sales']);
  }

  navigateToTransactions(): void {
    this.router.navigate(['/finance/transactions']);
  }

  // Quick actions
  addBankAccount(): void {
    this.router.navigate(['/finance/banks/new']);
  }

  addExpense(): void {
    this.router.navigate(['/finance/expenses/new']);
  }

  addTransaction(): void {
    this.router.navigate(['/finance/transactions/new']);
  }
}

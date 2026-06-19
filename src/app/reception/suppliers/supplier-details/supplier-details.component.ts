import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OIL_CREDIT_DASHBOARD } from './osmDashConf/oil-credit-dashboard.config';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { SupplierPaymentHistoryComponent } from '../supplier-payment-history/supplier-payment-history.component';
import { ToastService } from '../../../shared/services/toast.service';
import { DocumentGenerationService } from '../../../shared/services/document-generation.service';
import { OilSaleActionsService } from '../../../finance/service/oil-sale-actions.service';
import { OliveReceptionActionsService } from '../../olive-reception/olive-reception-actions.service';
import { OilReceptionActionsService } from '../../oil-reception/oil-reception-actions.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SupplierPaymentHistoryMobileComponent } from '../supplier-payment-history-mobile/supplier-payment-history-mobile.component';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { CardComponent } from '../../../theme/components/card/card.component';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { BASE_DASHBOARD } from './osmDashConf/base_dashboard.config';
import { OLIVE_PURCHASE_DASHBOARD } from './osmDashConf/olive-purchase-dashboard.config';
import { EXCHANGE_DASHBOARD } from './osmDashConf/exchange-dashboard.config';
import { SIMPLE_RECEPTION_DASHBOARD } from './osmDashConf/simple-trt--dashboard.config';
import { OIL_PURCHASE_DASHBOARD } from './osmDashConf/oil-purchase-dashboard.config';
import { OIL_SALES_DASHBOARD_CONFIG } from './osmDashConf/oil-sales-dashboard.config';
import { WASTE_DASHBOARD } from './osmDashConf/waste-sale-dashboard.config';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { FinancialTransactionService, SupplierFinancialSummary } from '../../../finance/service/financial-transaction.service';
import { buildSupplierTransactionsDashboard } from './supplier-transactions-dashboard.config';
import { catchError, tap } from 'rxjs/operators';

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

export type OperationType =
  | 'BASE'
  | 'OIL_CREDIT'
  | 'OIL_SALE'
  | 'OLIVE_PURCHASE'
  | 'OIL_PURCHASE'
  | 'EXCHANGE'
  | 'SIMPLE_RECEPTION'
  | 'WASTE';

interface OperationCard {
  type: OperationType;
  titleKey: string;
  icon: string;
  color: 'primary' | 'accent' | 'warn';
}

type OperationStats = Record<OperationType, { count: number; total: number } | undefined>;

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
export class SupplierDetailsComponent implements OnInit {
  destroyRef = inject(DestroyRef);

  supplierId: string | null = null;
  supplier: SupplierType | null = null;
  supplierDisplayName = '';
  activePageTab: 'operations' | 'finance' | 'profile' = 'operations';
  activeOp: OperationType = 'SIMPLE_RECEPTION';
  financeSummary: SupplierFinancialSummary | null = null;
  financeSummaryLoading = false;
  financeDashboardConfig?: DashboardConfig;
  @ViewChild('financeDashboard') financeDashboard?: OsmDashboard;

  operationCards: OperationCard[] = [
    {
      type: 'SIMPLE_RECEPTION',
      titleKey: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION',
      icon: 'move_to_inbox',
      color: 'accent'
    },
    {
      type: 'BASE',
      titleKey: 'DELIVERIES.OPERATION_TYPE.BASE',
      icon: 'category',
      color: 'accent'
    },
    {
      type: 'OLIVE_PURCHASE',
      titleKey: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE',
      icon: 'local_grocery_store',
      color: 'primary'
    },
    {
      type: 'OIL_PURCHASE',
      titleKey: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE',
      icon: 'water_drop',
      color: 'primary'
    },
    {
      type: 'EXCHANGE',
      titleKey: 'DELIVERIES.OPERATION_TYPE.EXCHANGE',
      icon: 'swap_horiz',
      color: 'accent'
    },
    { type: 'WASTE', titleKey: 'WASTE.TYPES.GRIGNON', icon: 'recycling', color: 'warn' },
    {
      type: 'OIL_CREDIT',
      titleKey: 'TRANSACTIONS.PAYMENT_METHODS.OIL_CREDIT',
      icon: 'savings',
      color: 'accent'
    },
    { type: 'OIL_SALE', titleKey: 'OIL_SALES.TITLE', icon: 'water_drop', color: 'primary' }
  ];

  stats: OperationStats = {
    BASE: undefined,
    OLIVE_PURCHASE: undefined,
    OIL_PURCHASE: undefined,
    EXCHANGE: undefined,
    SIMPLE_RECEPTION: undefined,
    OIL_SALE: undefined,
    OIL_CREDIT: undefined,
    WASTE: undefined
  };
  @ViewChild('dashboardByOperation') dashboardByOperation!: OsmDashboard;
  private baseDashboardConfigs: Record<OperationType, DashboardConfig> = {
    BASE: BASE_DASHBOARD,
    OLIVE_PURCHASE: OLIVE_PURCHASE_DASHBOARD,
    OIL_PURCHASE: OIL_PURCHASE_DASHBOARD,
    EXCHANGE: EXCHANGE_DASHBOARD,
    SIMPLE_RECEPTION: SIMPLE_RECEPTION_DASHBOARD,
    WASTE: WASTE_DASHBOARD,
    OIL_CREDIT: OIL_CREDIT_DASHBOARD,
    OIL_SALE: OIL_SALES_DASHBOARD_CONFIG
  };
  dashboardConfigs: Record<OperationType, DashboardConfig> = { ...this.baseDashboardConfigs };
  private oliveDeliveryTypes: OperationType[] = ['BASE', 'OLIVE_PURCHASE', 'EXCHANGE', 'SIMPLE_RECEPTION'];
  private oilDeliveryTypes: OperationType[] = ['OIL_PURCHASE'];
  private opStatConfigs: Record<
    OperationType,
    {
      endpoint: string;
      filterField: string;
      reducer: (item: any) => number;
    }
  > = {
    BASE: {
      endpoint: 'production/deliveries',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? 0)
    },
    OLIVE_PURCHASE: {
      endpoint: 'production/deliveries',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? 0)
    },
    OIL_PURCHASE: {
      endpoint: 'production/deliveries',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? 0)
    },
    EXCHANGE: {
      endpoint: 'production/deliveries',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? 0)
    },
    SIMPLE_RECEPTION: {
      endpoint: 'production/deliveries',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? 0)
    },
    WASTE: {
      endpoint: 'production/waste',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalPrice ?? it?.totalAmount ?? 0)
    },
    OIL_SALE: {
      endpoint: 'production/oil_sale',
      filterField: 'supplier.id',
      reducer: (it) => Number(it?.totalAmount ?? Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0) ?? it?.totalPrice ?? 0)
    },
    OIL_CREDIT: {
      endpoint: 'finance/oil-credit',
      filterField: 'destinataire',
      reducer: (it) => Number(it?.amount ?? it?.value ?? 0)
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private supplierService: SupplierTypeService,
    private financialTransactionService: FinancialTransactionService,
    private _dialog: MatDialog,
    private translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private toast: ToastService,
    private documentGenerationService: DocumentGenerationService,
    private oilSaleActions: OilSaleActionsService,
    private oliveActions: OliveReceptionActionsService,
    private oilActions: OilReceptionActionsService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');

    const state = history.state || {};
    const fromState: SupplierType | null =
      state.supplier ??
      state.row?.supplier ??
      (state.id && (state.name || state.firstName || state.lastName) ? (state as SupplierType) : null);

    if (fromState) {
      this.supplier = fromState;
      this.supplierDisplayName = `${this.supplier.name ?? ''} ${this.supplier.lastname ?? ''}`.trim();
    } else if (this.supplierId) {
      this.fetchSupplierById(this.supplierId).subscribe();
    }

    if (this.supplierId) {
      this.financeDashboardConfig = buildSupplierTransactionsDashboard(this.supplierId);
      this.dashboardConfigs = {
        BASE: this.withSupplierFilter(this.baseDashboardConfigs['BASE'], this.supplierId, false),
        OLIVE_PURCHASE: this.withSupplierFilter(this.baseDashboardConfigs['OLIVE_PURCHASE'], this.supplierId, false),
        OIL_PURCHASE: this.withSupplierFilter(this.baseDashboardConfigs['OIL_PURCHASE'], this.supplierId, false),
        EXCHANGE: this.withSupplierFilter(this.baseDashboardConfigs['EXCHANGE'], this.supplierId, false),
        SIMPLE_RECEPTION: this.withSupplierFilter(this.baseDashboardConfigs['SIMPLE_RECEPTION'], this.supplierId, false),
        WASTE: this.withSupplierFilter(this.baseDashboardConfigs['WASTE'], this.supplierId, false),
        OIL_SALE: this.withSupplierFilter(this.baseDashboardConfigs['OIL_SALE'], this.supplierId, false),
        OIL_CREDIT: this.withSupplierFilter(this.baseDashboardConfigs['OIL_CREDIT'], this.supplierId, true)
      };

      // ✅ ensure the suffix is applied to ALL configs right after building them
      // this.appendSupplierNameToTitles();

      this.countAllOperations();
      this.loadOperation(this.activeOp);
      this.dashboardByOperation.refrechData();
    }
  }

  loadPageTab(tab: 'operations' | 'finance' | 'profile'): void {
    this.activePageTab = tab;
    if (tab === 'finance') {
      this.loadFinanceSummary();
      this.financeDashboard?.refrechData();
    }
  }

  loadFinanceSummary(): void {
    if (!this.supplierId || this.financeSummaryLoading) return;
    this.financeSummaryLoading = true;
    this.financialTransactionService.getSupplierFinancialSummary(this.supplierId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((summary) => {
        this.financeSummary = summary;
        this.financeSummaryLoading = false;
      }),
      catchError(() => {
        this.financeSummaryLoading = false;
        return of(null);
      })
    ).subscribe();
  }

  handleFinanceAction(event: { row: { id?: string }; action: string }): void {
    if (event.action?.toUpperCase() === 'READ' && event.row?.id) {
      this.router.navigate(['/finance/transactions', event.row.id, 'view']);
    }
  }

  get supplierTypeLabel(): string {
    return this.supplier?.genericSupplierType?.name ?? '';
  }

  showStorageInfo(): boolean {
    return !!this.supplier?.hasStorage;
  }

  handlePaymentAction(e: { row: any; action: string }) {
    const actionLabel = e.action?.toUpperCase();

    if (this.activeOp === 'OIL_SALE') {
      switch (actionLabel) {
        case 'PAY':
          this.initiatePayment(e.row, PaymentSourceType.OIL_SALE_prc);
          return;
        case 'GEN_INVOICE':
          if (e.row?.id) {
            this.documentGenerationService.downloadOilSaleInvoicePdf(e.row.id);
          }
          return;
        default:
          this.oilSaleActions.handleAction(actionLabel, e.row, () => {
            this.countAllOperations();
            this.dashboardByOperation.refrechData();
          });
          return;
      }
    }

    if (this.oilDeliveryTypes.includes(this.activeOp)) {
      if (actionLabel === 'GEN_INVOICE') {
        if (!e.row?.id) return;
        this.documentGenerationService.downloadCommercialPdf(e.row.id);
        return;
      }
      this.oilActions.handleAction(actionLabel, e.row, {
        onRefresh: () => {
          this.countAllOperations();
          this.dashboardByOperation.refrechData();
        }
      });
      return;
    }

    if (this.oliveDeliveryTypes.includes(this.activeOp)) {
      if (actionLabel === 'GEN_INVOICE') {
        if (!e.row?.id) return;
        this.documentGenerationService.downloadCommercialPdf(e.row.id);
        return;
      }
      this.oliveActions.handleAction(actionLabel, e.row, {
        onRefresh: () => {
          this.countAllOperations();
          this.dashboardByOperation.refrechData();
        }
      });
      return;
    }

    switch (actionLabel) {
      case 'GEN_INVOICE': {
        if (!e.row?.id) return;
        const src = this.getCurrentInvoiceSourceType();
        if (src === InvoiceSource.DELIVERY_inv) {
          this.documentGenerationService.downloadCommercialPdf(e.row.id);
        } else if (src === InvoiceSource.OIL_SALE_inv) {
          this.documentGenerationService.downloadOilSaleInvoicePdf(e.row.id);
        } else {
          this.toast.error('AUTO.IMPOSSIBLE_DE_GENERER_LA_FACTURE');
        }
        break;
      }
      case 'PAY': {
        const src = this.getCurrentPaymentSourceType();
        this.initiatePayment(e.row, src);
        break;
      }
    }
  }

  initiatePayment(row: any, sourceType: string) {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.Handset, Breakpoints.TabletPortrait]);
    const Comp = isMobile ? SupplierPaymentHistoryMobileComponent : SupplierPaymentHistoryComponent;
    const dialogRef = this._dialog.open(Comp, {
      width: isMobile ? '100vw' : '41vw',
      height: isMobile ? '70vh' : '100vh',
      data: { row, sourceType },
      autoFocus: false,
      disableClose: true,
      panelClass: isMobile ? 'mobile-bottom-sheet' : 'desktop-payment-dialog',
      hasBackdrop: true
    });
    if (!isMobile) dialogRef.updatePosition({ right: '0px', top: '0px' });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((result) => {
          if (result?.ok) {
            this.toast.success(result.message || 'AUTO.PAIEMENT_REUSSI');
            this.countAllOperations();
            this.dashboardByOperation.refrechData();
          } else if (result) {
            this.toast.error(result.message || 'AUTO.ECHEC_DU_PAIEMENT');
          }
        })
      )
      .subscribe();
  }

  loadOperation(type: OperationType) {
    this.activeOp = type;
    this.dashboardByOperation.refrechData();
  }

  private appendSupplierNameToTitles(): void {
    if (!this.supplierDisplayName) return;

    for (const op of Object.keys(this.dashboardConfigs) as OperationType[]) {
      const cfg = this.dashboardConfigs[op];
      const baseTitle = cfg.title ?? (cfg.titleTranslatePath ? this.translate.instant(cfg.titleTranslatePath) : '');

      // Écrase simplement le title avec le suffixe fournisseur
      this.dashboardConfigs[op] = {
        ...cfg,
        titleTranslatePath: `${baseTitle} — ${this.supplierDisplayName}`
      };
    }

    if (this.dashboardByOperation) this.dashboardByOperation.refrechData();
  }

  private fetchSupplierById(id: string): Observable<any> {
    return this.supplierService.getSupplier(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((res: any) => {
        const item = Array.isArray(res?.data) ? res.data[0] : (res?.data ?? null);
        if (item) {
          this.supplier = item as SupplierType;
          this.supplierDisplayName = `${this.supplier.name ?? ''} ${this.supplier.lastname ?? ''}`.trim();
         }
      }),
      catchError(() => of(null))
    );
  }

  private cloneCfg<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /** Inject supplier (and, for credits, destinataire) into a config's defaultSearchData */
  private withSupplierFilter(cfg: DashboardConfig, supplierId: string | null, isCredit = false): DashboardConfig {
    if (!supplierId) return cfg;
    const copy = this.cloneCfg(cfg);
    const prev = copy.defaultSearchData ?? {};
    const prevSD: any = prev.searchData ?? {};
    const prevSearch: any = prevSD.search ?? {};
    copy.defaultSearchData = {
      ...prev,
      searchData: {
        ...prevSD,
        search: {
          ...prevSearch,
          ...(isCredit ? { destinataire: { equalValue: supplierId } } : { 'supplier.id': { equalValue: supplierId } })
        }
      }
    };
    return copy;
  }

  private countAllOperations(): void {
    if (!this.supplierId) return;
    const ops: OperationType[] = [
      'BASE',
      'OLIVE_PURCHASE',
      'OIL_PURCHASE',
      'EXCHANGE',
      'SIMPLE_RECEPTION',
      'WASTE',
      'OIL_SALE',
      'OIL_CREDIT'
    ];
    const requests = ops.map((op) => this.fetchStats(op));
    forkJoin(requests).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private fetchStats(op: OperationType) {
    if (!this.supplierId) return of(null);

    const statConfig = this.opStatConfigs[op];
    const baseCfg = this.baseDashboardConfigs[op];

    const search: SearchData = {
      ...(baseCfg.defaultSearchData || {}),
      searchData: {
        ...(baseCfg.defaultSearchData?.searchData || {}),
        search: {
          ...(baseCfg.defaultSearchData?.searchData?.search || {}),
          isDeleted: { equalValue: false },
          [statConfig.filterField]: { equalValue: this.supplierId },
          ...([...this.oliveDeliveryTypes, ...this.oilDeliveryTypes].includes(op) ? { operationType: { equalValue: op } } : {})
        }
      }
    };

    return this.searchService.search(search, statConfig.endpoint).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((res: any) => {
        const data = res?.data ?? [];
        const count = res?.total ?? data.length ?? 0;
        const total = data.reduce(
          (sum: number, it: any) => sum + (Number.isFinite(statConfig.reducer(it)) ? statConfig.reducer(it) : 0),
          0
        );
        this.stats[op] = { count, total };
      })
    );
  }

  private getCurrentPaymentSourceType(): PaymentSourceType {
    if (this.activeOp === 'WASTE') return PaymentSourceType.WASTE_SALE_prc;
    if (this.activeOp === 'OIL_SALE') return PaymentSourceType.OIL_SALE_prc;
    return PaymentSourceType.DELIVERY_prc;
  }

  private getCurrentInvoiceSourceType(): InvoiceSource {
    if (this.activeOp === 'WASTE') return InvoiceSource.WASTE_SALE_inv;
    if (this.activeOp === 'OIL_SALE') return InvoiceSource.OIL_SALE_inv;
    return InvoiceSource.DELIVERY_inv;
  }

  private refreshList() {
    if (this.dashboardByOperation) this.dashboardByOperation.refrechData();
  }
}

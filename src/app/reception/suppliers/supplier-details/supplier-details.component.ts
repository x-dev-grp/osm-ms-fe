import { Component, DestroyRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject, tap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { OIL_CREDIT_DASHBOARD } from './osmDashConf/oil-credit-dashboard.config';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { SearchData } from '../../../shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { SupplierPaymentHistoryComponent } from '../supplier-payment-history/supplier-payment-history.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PdfGeneratorFactureService } from '../../../shared/services/pdf-generator-facture.service';
import { WASTE_DASHBOARD } from './osmDashConf/waste-sale-dashboard.config';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SupplierPaymentHistoryMobileComponent } from '../supplier-payment-history-mobile/supplier-payment-history-mobile.component';
import { PdfConfigFactoryService } from '../../../shared/services/pdf-config-factory.service';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { CardComponent } from '../../../theme/components/card/card.component';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';

import { OilSale } from '../../../finance/models/oil-sale.model';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { WasteSale } from '../../../finance/models/Waste.model';
import { BASE_DASHBOARD } from './osmDashConf/base_dashboard.config';
import { OLIVE_PURCHASE_DASHBOARD } from './osmDashConf/olive-purchase-dashboard.config';
import { EXCHANGE_DASHBOARD } from './osmDashConf/exchange-dashboard.config';
import { SIMPLE_RECEPTION_DASHBOARD } from './osmDashConf/simple-trt--dashboard.config';
import { OIL_PURCHASE_DASHBOARD } from './osmDashConf/oil-purchase-dashboard.config';
import { OIL_SALES_DASHBOARD_CONFIG } from './osmDashConf/oil-sales-dashboard.config';

/** Old enums kept for downstream services (pdf/payment) */
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

/** Operation types shown as cards */
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
export class SupplierDetailsComponent implements OnInit, OnDestroy {
  destroyRef = inject(DestroyRef);

  loading = false;
  supplierId: string | null = null;

  /** active operation card */
  activeOp: OperationType = 'SIMPLE_RECEPTION';

  operationCards: OperationCard[] = [
    { type: 'SIMPLE_RECEPTION', titleKey: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION', icon: 'move_to_inbox', color: 'accent' },
    { type: 'BASE',             titleKey: 'DELIVERIES.OPERATION_TYPE.BASE',               icon: 'category',            color: 'accent'  },
    { type: 'OLIVE_PURCHASE',   titleKey: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE',     icon: 'local_grocery_store', color: 'primary' },
    { type: 'OIL_PURCHASE',     titleKey: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE',       icon: 'water_drop',          color: 'primary' },
    { type: 'EXCHANGE',         titleKey: 'DELIVERIES.OPERATION_TYPE.EXCHANGE',           icon: 'swap_horiz',          color: 'accent'  },
    { type: 'WASTE',            titleKey: 'WASTE.TYPES.GRIGNON',                           icon: 'recycling',           color: 'warn'    },
    { type: 'OIL_CREDIT',       titleKey: 'TRANSACTIONS.PAYMENT_METHODS.OIL_CREDIT',      icon: 'savings',             color: 'accent'  },
    { type: 'OIL_SALE',         titleKey: 'OIL_SALES.TITLE',                               icon: 'water_drop',          color: 'primary' }
  ];

  /** per-operation metrics */
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

  /** Base configs (constants you imported) */
  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  WASTE_DASHBOARD: DashboardConfig = WASTE_DASHBOARD;
  BASE_DASHBOARD: DashboardConfig = BASE_DASHBOARD;
  OLIVE_PURCHASE_DASHBOARD: DashboardConfig = OLIVE_PURCHASE_DASHBOARD;
  OIL_PURCHASE_DASHBOARD: DashboardConfig = OIL_PURCHASE_DASHBOARD;
  OIL_SALE_DASHBOARD: DashboardConfig = OIL_SALES_DASHBOARD_CONFIG;
  EXCHANGE_DASHBOARD: DashboardConfig = EXCHANGE_DASHBOARD;
  SIMPLE_RECEPTION_DASHBOARD: DashboardConfig = SIMPLE_RECEPTION_DASHBOARD;

  /** The config actually bound to the single table outlet */
  dashboardConfigs: Record<OperationType, DashboardConfig> = {
    BASE: this.BASE_DASHBOARD,
    OLIVE_PURCHASE: this.OLIVE_PURCHASE_DASHBOARD,
    OIL_PURCHASE: this.OIL_PURCHASE_DASHBOARD,
    EXCHANGE: this.EXCHANGE_DASHBOARD,
    SIMPLE_RECEPTION: this.SIMPLE_RECEPTION_DASHBOARD,
    WASTE: this.WASTE_DASHBOARD,
    OIL_CREDIT: this.OIL_CREDIT_DASHBOARD,
    OIL_SALE: this.OIL_SALE_DASHBOARD
  };

  @ViewChild('dashboardByOperation') dashboardByOperation!: OsmDashboard;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService,
    private _dialog: MatDialog,
    private breakpointObserver: BreakpointObserver,
    private toast: ToastService,
    private pdfFactureService: PdfGeneratorFactureService,
    private companyService: CompanyProfileService,
    private pdfFactory: PdfConfigFactoryService
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    // preload all stats, then select a default op
    this.countAllOperations();
    this.loadOperation(this.activeOp);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** =========================
   *  ACTION HANDLERS
   *  ========================= */
  handlePaymentAction(e: { row: any; action: string }) {
    const actionLabel = e.action;
    switch (actionLabel) {
      case 'GEN_INVOICE': {
        if (!e.row) return;
        const src = this.getCurrentInvoceSourceType();
        const cfg = this.pdfFactory.build(e.row, src);
        if ('total' in cfg && 'paid' in cfg && 'unpaid' in cfg) {
          this.pdfFactureService.generatePdfNoteDocument(cfg);
        } else {
          this.pdfFactureService.generatePdfDocument(cfg);
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
    const isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset || Breakpoints.TabletPortrait);
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

    dialogRef.afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((result) => {
          if (result?.ok) {
            this.toast.success(result.message || 'Paiement réussi.');
            this.refreshList();
            this.countAllOperations();
          } else if (result) {
            this.toast.error(result.message || 'Échec du paiement.');
          }
        })
      )
      .subscribe();
  }

  /** =========================
   *  HELPERS (configs & filters)
   *  ========================= */
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

  /** =========================
   *  OPERATION LOADERS
   *  ========================= */
  loadOperation(type: OperationType) {
    this.activeOp = type;
    if (!this.supplierId) return;

    let base: DashboardConfig;

    switch (type) {
      // deliveries-based ops
      case 'BASE':             base = this.BASE_DASHBOARD; break;
      case 'OLIVE_PURCHASE':   base = this.OLIVE_PURCHASE_DASHBOARD; break;
      case 'OIL_PURCHASE':     base = this.OIL_PURCHASE_DASHBOARD; break;
      case 'EXCHANGE':         base = this.EXCHANGE_DASHBOARD; break;
      case 'SIMPLE_RECEPTION': base = this.SIMPLE_RECEPTION_DASHBOARD; break;

      // waste / oil sale / oil credit
      case 'WASTE':      base = this.WASTE_DASHBOARD; break;
      case 'OIL_SALE':   base = this.OIL_SALE_DASHBOARD; break;
      case 'OIL_CREDIT': base = this.OIL_CREDIT_DASHBOARD; break;
    }

    const cfg =
      type === 'OIL_CREDIT'
        ? this.withSupplierFilter(base!, this.supplierId, true)
        : this.withSupplierFilter(base!, this.supplierId, false);

    // IMPORTANT: update the mapping so the template input picks up the new object
    this.dashboardConfigs[type] = cfg;

    // refresh table if we’re already showing this op
    if (this.dashboardByOperation) this.dashboardByOperation.refrechData();
  }

  /** =========================
   *  COUNTS / SUMS (per op)
   *  ========================= */
  private countAllOperations(): void {
    if (!this.supplierId) return;

    const ops: OperationType[] = [
      'BASE', 'OLIVE_PURCHASE', 'OIL_PURCHASE', 'EXCHANGE', 'SIMPLE_RECEPTION',
      'WASTE', 'OIL_SALE', 'OIL_CREDIT'
    ];
    const requests = ops.map(op => this.fetchStats(op));
    forkJoin(requests).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** fetch and store stats for a single operation */
  private fetchStats(op: OperationType) {
    if (!this.supplierId) return of(null);

    // 1) WASTE (production/waste)
    if (op === 'WASTE') {
      const search: SearchData = {
        ...(this.WASTE_DASHBOARD.defaultSearchData || {}),
        searchData: {
          ...(this.WASTE_DASHBOARD.defaultSearchData?.searchData || {}),
          search: {
            ...(this.WASTE_DASHBOARD.defaultSearchData?.searchData?.search || {}),
            isDeleted: { equalValue: false },
            'supplier.id': { equalValue: this.supplierId }
          }
        }
      };
      return this.searchService.search(search, 'production/waste').pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          const data = res?.data ?? [];
          const count = res?.total ?? data.length ?? 0;
          const total = data.reduce((sum: number, it: any) => {
            const v = Number(it?.totalPrice ?? it?.totalAmount ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
          this.stats[op] = { count, total };
        })
      );
    }

    // 2) OIL_SALE (production/oil_sale)
    if (op === 'OIL_SALE') {
      const base = this.cloneCfg(this.OIL_SALE_DASHBOARD);
      const search: SearchData = {
        ...(base.defaultSearchData || {}),
        searchData: {
          ...(base.defaultSearchData?.searchData || {}),
          search: {
            ...(base.defaultSearchData?.searchData?.search || {}),
            isDeleted: { equalValue: false },
            'supplier.id': { equalValue: this.supplierId }
          }
        }
      };
      return this.searchService.search(search, 'production/oil_sale').pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          const data = res?.data ?? [];
          const count = res?.total ?? data.length ?? 0;
          const total = data.reduce((sum: number, it: any) => {
            const v = Number(
              it?.totalAmount ??
              (Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0)) ??
              it?.totalPrice ?? 0
            );
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
          this.stats[op] = { count, total };
        })
      );
    }

    // 3) OIL_CREDIT (finance/oil-credit)
    if (op === 'OIL_CREDIT') {
      const base = this.cloneCfg(this.OIL_CREDIT_DASHBOARD);
      const search: SearchData = {
        ...(base.defaultSearchData || {}),
        searchData: {
          ...(base.defaultSearchData?.searchData || {}),
          search: {
            ...(base.defaultSearchData?.searchData?.search || {}),
            isDeleted: { equalValue: false },
            destinataire: { equalValue: this.supplierId }
          }
        }
      };
      return this.searchService.search(search, 'finance/oil-credit').pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res: any) => {
          const data = res?.data ?? [];
          const count = res?.total ?? data.length ?? 0;
          const total = data.reduce((sum: number, it: any) => {
            const v = Number(it?.amount ?? it?.value ?? 0);
            return sum + (Number.isFinite(v) ? v : 0);
          }, 0);
          this.stats[op] = { count, total };
        })
      );
    }

    // 4) Deliveries (production/deliveries) for all other ops
    const base = this.cloneCfg(
      op === 'BASE' ? this.BASE_DASHBOARD
        : op === 'OLIVE_PURCHASE' ? this.OLIVE_PURCHASE_DASHBOARD
          : op === 'OIL_PURCHASE' ? this.OIL_PURCHASE_DASHBOARD
            : op === 'EXCHANGE' ? this.EXCHANGE_DASHBOARD
              : this.SIMPLE_RECEPTION_DASHBOARD
    );

    const deliveriesSearch: SearchData = {
      ...(base.defaultSearchData || {}),
      searchData: {
        ...(base.defaultSearchData?.searchData || {}),
        search: {
          ...(base.defaultSearchData?.searchData?.search || {}),
          isDeleted: { equalValue: false },
          'supplier.id': { equalValue: this.supplierId },
          operationType: { equalValue: op } // include BASE as explicit op
        }
      }
    };

    return this.searchService.search(deliveriesSearch, 'production/deliveries').pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((res: any) => {
        const data = res?.data ?? [];
        const count = res?.total ?? data.length ?? 0;
        const total = data.reduce((sum: number, it: any) => {
          const v = Number(
            it?.totalAmount ??
            (Number(it?.paidAmount ?? 0) + Number(it?.unpaidAmount ?? 0)) ?? 0
          );
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);
        this.stats[op] = { count, total };
      })
    );
  }

  /** =========================
   *  SOURCE TYPE RESOLVERS
   *  ========================= */
  private getCurrentPaymentSourceType(): PaymentSourceType {
    if (this.activeOp === 'WASTE') return PaymentSourceType.WASTE_SALE_prc;
    if (this.activeOp === 'OIL_SALE') return PaymentSourceType.OIL_SALE_prc;
    return PaymentSourceType.DELIVERY_prc;
  }

  private getCurrentInvoceSourceType(): InvoiceSource {
    if (this.activeOp === 'WASTE') return InvoiceSource.WASTE_SALE_inv;
    if (this.activeOp === 'OIL_SALE') return InvoiceSource.OIL_SALE_inv;
    return InvoiceSource.DELIVERY_inv;
  }

  /** =========================
   *  REFRESH
   *  ========================= */
  private refreshList() {
    if (this.dashboardByOperation) this.dashboardByOperation.refrechData();
  }
}


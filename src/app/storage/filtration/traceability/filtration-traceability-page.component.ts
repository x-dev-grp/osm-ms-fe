import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, map, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../../shared/services/toast.service';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';
import { ProductionTraceabilityService } from '../../../shared/services/production-traceability.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { QualityControlResultDto } from '../../../shared/models/QualityControlResultDto';
import { OilTransaction } from '../../../shared/models/OilTransaction';
import { ProductionGenealogy, ProductionRootSource } from '../../../shared/models/production-genealogy.model';
import { FiltrationQcEntryDialogComponent } from './filtration-qc-entry-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-filtration-traceability-page',
  standalone: true,
  imports: [TranslateModule,
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './filtration-traceability-page.component.html',
  styleUrls: ['./filtration-traceability-page.component.scss']
})
export class FiltrationTraceabilityPageComponent implements OnInit {

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  operation = signal<FiltrationOperation | null>(null);
  genealogy = signal<ProductionGenealogy | null>(null);
  sourceDeliveries = signal<UnifiedDelivery[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private filtrationApi: FiltrationApiService,
    private transactionService: OilTransactionService,
    private productionTraceability: ProductionTraceabilityService,
    private dialog: MatDialog,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Identifiant de l operation introuvable.');
      this.loading.set(false);
      return;
    }

    this.filtrationApi.getById(id).pipe(
      switchMap(op => {
        this.operation.set(op);

        const sourceUnitId = op.source?.id;
        if (!sourceUnitId) {
          return of({ genealogy: null, deliveries: [] });
        }

        const genealogyAnchor = op.target?.id || op.source?.id;
        const genealogy$ = genealogyAnchor
          ? this.productionTraceability.getGenealogy(genealogyAnchor).pipe(catchError(() => of(null)))
          : of(null);

        return forkJoin({
          genealogy: genealogy$,
          deliveries: this.loadDeliveriesFromTransactions(sourceUnitId)
        });
      }),
      catchError(() => {
        this.error.set('Erreur lors du chargement de la tracabilite.');
        this.loading.set(false);
        return of({ genealogy: null, deliveries: [] });
      })
    ).subscribe(({ genealogy, deliveries }) => {
      this.genealogy.set(genealogy);
      this.sourceDeliveries.set(deliveries || []);
      this.loading.set(false);
    });
  }

  get statusClass(): string {
    const s = this.operation()?.status as string;
    if (s === 'COMPLETED') return 'status-completed';
    if (s === 'IN_PROGRESS') return 'status-inprogress';
    if (s === 'CANCELLED') return 'status-cancelled';
    return 'status-created';
  }

  rootSources(): ProductionRootSource[] {
    return this.genealogy()?.rootSources || [];
  }

  rootSourceExtra(source: ProductionRootSource | undefined, key: string): string {
    const value = source?.extra?.[key];
    return value == null || value === '' ? '-' : String(value);
  }

  rootSourceQualityEntries(source: ProductionRootSource): { key: string; value: string }[] {
    return Object.entries(source.qualityControls || {}).map(([key, value]) => ({ key, value }));
  }

  filteredQualityEntries(): { key: string; value: string }[] {
    const direct = this.genealogy()?.filteredQualityControls;
    if (direct && Object.keys(direct).length > 0) {
      return Object.entries(direct).map(([key, value]) => ({ key, value }));
    }

    const fromStep = this.genealogy()?.filtrations
      ?.map(step => step.qualityControls)
      .find(controls => !!controls && Object.keys(controls).length > 0);

    return fromStep ? Object.entries(fromStep).map(([key, value]) => ({ key, value })) : [];
  }

  storageLabel(storage: { name?: string; lotNumber?: string; id?: string } | null | undefined, fallbackLot?: string): string {
    const name = storage?.name || 'Cuve inconnue';
    const lot = storage?.lotNumber || fallbackLot;
    return lot ? `${name} | Lot ${lot}` : name;
  }

  qcStatus(qc: QualityControlResultDto): 'PASS' | 'FAIL' | 'INFO' {
    const rule = qc.rule;
    if (rule.ruleType === 'BOOLEAN') {
      return rule.booleanValue === true ? 'PASS' : 'FAIL';
    }
    if (rule.ruleType === 'NUMERIC') {
      const val = parseFloat(qc.measuredValue);
      if (rule.minValue !== undefined && val < rule.minValue) return 'FAIL';
      if (rule.maxValue !== undefined && val > rule.maxValue) return 'FAIL';
      return 'PASS';
    }
    return 'INFO';
  }

  goBack(): void {
    this.router.navigate(['/storage', 'oil-filtering']);
  }

  prepareLabel(): void {
    const operation = this.operation();
    if (operation?.operationId) {
      this.router.navigate(['/labels', 'new'], {
        queryParams: {
          filtrationOperationId: operation.operationId,
          lotId: operation.target?.id
        }
      });
    }
  }

  openFiltrationQcEntry(): void {
    const operation = this.operation();
    const filtrationOperationId = operation?.operationId;
    if (!filtrationOperationId) {
      this.toast.error('AUTO.OPERATION_DE_FILTRATION_INTROUVABLE');
      return;
    }

    const ref = this.dialog.open(FiltrationQcEntryDialogComponent, {
      width: '860px',
      maxWidth: '96vw',
      data: {
        filtrationOperationId,
        traceabilityLotId: this.genealogy()?.traceabilityLotId || null
      }
    });

    ref.afterClosed().subscribe((saved: boolean) => {
      if (saved) {
        this.refreshGenealogy();
      }
    });
  }

  canEnterFilteredQc(): boolean {
    const operation = this.operation();
    return !!operation?.operationId && operation?.status === 'COMPLETED';
  }

  private loadDeliveriesFromTransactions(sourceUnitId: string) {
    return this.transactionService.getByStorageUnit(sourceUnitId).pipe(
      map((res: any) => {
        const transactions: OilTransaction[] = res?.data ?? (Array.isArray(res) ? res : []);
        const deliveries: UnifiedDelivery[] = [];
        const seenIds = new Set<string>();

        transactions.forEach(tx => {
          if (tx.reception?.id && !seenIds.has(tx.reception.id) && tx.storageUnitDestination?.id === sourceUnitId) {
            deliveries.push(tx.reception);
            seenIds.add(tx.reception.id);
          }
        });

        return deliveries;
      }),
      catchError(() => of([]))
    );
  }

  private refreshGenealogy(): void {
    const op = this.operation();
    const genealogyAnchor = op?.target?.id || op?.source?.id;
    if (!genealogyAnchor) {
      return;
    }

    this.productionTraceability.getGenealogy(genealogyAnchor)
      .pipe(catchError(() => of(null)))
      .subscribe((genealogy) => {
        this.genealogy.set(genealogy);
      });
  }
}

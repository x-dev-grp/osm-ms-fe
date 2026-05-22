import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {forkJoin, map, Observable, of} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { OilTransactionService } from '../../../shared/services/OilTransactionService';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { QualityControlResultDto } from '../../../shared/models/QualityControlResultDto';
import { OilTransaction } from '../../../shared/models/OilTransaction';

@Component({
  selector: 'app-filtration-traceability-page',
  standalone: true,
  imports: [
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
  sourceDeliveries = signal<UnifiedDelivery[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private filtrationApi: FiltrationApiService,
    private deliveryService: UnifiedDeliveryService,
    private transactionService: OilTransactionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Identifiant de l\'opération introuvable.');
      this.loading.set(false);
      return;
    }

    this.filtrationApi.getById(id).pipe(
      switchMap(op => {
        this.operation.set(op);
        console.log('🔍 Filtration Operation Loaded:', op);

        const sourceUnitId = op.source?.id;

        if (!sourceUnitId) {
          console.warn('⚠️ No source unit ID found for this operation.');
          return of([]);
        }

        // Strictly fetch by Transaction History (Exact Ledger)
        return this.transactionService.getByStorageUnit(sourceUnitId).pipe(
          map((res: any) => {
            const transactions: OilTransaction[] = res?.data ?? (Array.isArray(res) ? res : []);

            const deliveries: UnifiedDelivery[] = [];
            const seenIds = new Set<string>();

            transactions.forEach(tx => {
              if (tx.reception && tx.reception.id && !seenIds.has(tx.reception.id)) {
                // If tank was destination, this oil came from this reception
                if (tx.storageUnitDestination?.id === sourceUnitId) {
                  deliveries.push(tx.reception);
                  seenIds.add(tx.reception.id);
                }
              }
            });

            return deliveries;
          }),
          catchError(err => {
            return of([]);
          })
        );
      }),
      catchError(err => {
        this.error.set('Erreur lors du chargement de la traçabilité.');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe((deliveries: UnifiedDelivery[]) => {
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
}

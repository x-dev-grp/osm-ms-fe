import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { ProductionTraceabilityService } from '../../../shared/services/production-traceability.service';
import { QualityControlResultService } from '../../../shared/services/quality-control-result.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { QcEntryStudioComponent } from '../../../shared/qc/components/qc-entry-studio/qc-entry-studio.component';

@Component({
  selector: 'app-filtration-controle-qualite',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    QcEntryStudioComponent
  ],
  templateUrl: './filtration-controle-qualite.component.html',
  styleUrls: ['./filtration-controle-qualite.component.scss']
})
export class FiltrationControleQualiteComponent implements OnInit, OnDestroy {
  operation: FiltrationOperation | null = null;
  traceabilityLotId: string | null = null;
  isLoading = true;
  isQualityControlDone = false;
  message = '';
  private subs: Subscription[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly filtrationApi: FiltrationApiService,
    private readonly productionTraceability: ProductionTraceabilityService,
    private readonly qcResultService: QualityControlResultService,
    private readonly toast: ToastService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const operationId = this.route.snapshot.paramMap.get('id');
    if (!operationId) {
      this.message = 'AUTO.OPERATION_DE_FILTRATION_INTROUVABLE';
      this.isLoading = false;
      return;
    }

    this.subs.push(
      this.filtrationApi
        .getById(operationId)
        .pipe(
          switchMap((operation) => {
            this.operation = operation;
            if (String(operation.status) !== 'COMPLETED') {
              this.message = 'FILTRATION_QC.ONLY_COMPLETED';
              return of(null);
            }

            const genealogyAnchor = operation.target?.id || operation.source?.id;
            const genealogy$ = genealogyAnchor
              ? this.productionTraceability.getGenealogy(genealogyAnchor).pipe(catchError(() => of(null)))
              : of(null);

            return genealogy$.pipe(
              switchMap((genealogy) => {
                this.traceabilityLotId = genealogy?.traceabilityLotId || null;
                return this.qcResultService.getResultsByFiltration(operationId);
              })
            );
          }),
          catchError(() => {
            this.message = 'CONTROLE_QUALITE.MESSAGES.ERROR.LOAD';
            return of(null);
          })
        )
        .subscribe((qcResponse) => {
          if (qcResponse?.data) {
            const results = Array.isArray(qcResponse.data) ? qcResponse.data : [qcResponse.data];
            this.isQualityControlDone = results.length > 0;
          }
          if (!this.message) {
            this.isLoading = false;
          } else if (this.message !== 'FILTRATION_QC.ONLY_COMPLETED') {
            this.isLoading = false;
          } else {
            this.isLoading = false;
          }
          this.cdr.detectChanges();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onQcSaved(): void {
    this.isQualityControlDone = true;
    this.toast.success('AUTO.RESULTATS_CREES_AVEC_SUCCES');
    this.cdr.detectChanges();
  }

  goBack(): void {
    const id = this.operation?.operationId;
    if (id) {
      void this.router.navigate(['/storage', 'oil-filtering', id, 'traceability']);
      return;
    }
    void this.router.navigate(['/storage', 'oil-filtering']);
  }

  storageLabel(storage: { name?: string; lotNumber?: string; id?: string } | null | undefined): string {
    const name = storage?.name || '—';
    const lot = storage?.lotNumber;
    return lot ? `${name} (${lot})` : name;
  }
}

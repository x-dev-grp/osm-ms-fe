import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiResponse } from '../../../models/api-response';

import { QualityControlRule } from '../../../models/quality-control-rule';
import { QualityControlResultDto } from '../../../models/QualityControlResultDto';
import { QualityControlRuleService } from '../../../services/quality-control-rule.service';
import { QualityControlResultService } from '../../../services/quality-control-result.service';
import { ToastService } from '../../../services/toast.service';
import { QcComplianceRailComponent } from '../qc-compliance-rail/qc-compliance-rail.component';
import { QcRuleFieldComponent } from '../qc-rule-field/qc-rule-field.component';
import { QcChecklistSummary, QcEntryContext } from '../../models/qc-context.model';
import { buildQcChecklist, buildQcFormControls, buildResultPayload } from '../../utils/qc-validation.util';

@Component({
  selector: 'app-qc-entry-studio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    QcRuleFieldComponent,
    QcComplianceRailComponent
  ],
  templateUrl: './qc-entry-studio.component.html',
  styleUrls: ['./qc-entry-studio.component.scss']
})
export class QcEntryStudioComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) context!: QcEntryContext;
  @Input() deliveryId?: string | null;
  @Input() oliveIdx?: string | null;
  @Input() storageUnitId?: string | null;
  @Input() filtrationOperationId?: string | null;
  @Input() traceabilityLotId?: string | null;
  @Input() canSubmit = true;
  @Input() compact = false;
  @Input() showSaveButton = true;
  @Input() preSave?: () => Observable<boolean> | Promise<boolean>;

  @Output() saved = new EventEmitter<void>();
  @Output() saveFailed = new EventEmitter<string>();

  rules: QualityControlRule[] = [];
  form: FormGroup = new FormGroup({});
  loading = false;
  saving = false;
  message = '';
  readOnly = false;
  summary: QcChecklistSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    percent: 0,
    items: []
  };
  railExpanded = true;

  private existingResults: QualityControlResultDto[] = [];
  private subs: Subscription[] = [];

  constructor(
    private readonly qcRuleService: QualityControlRuleService,
    private readonly qcResultService: QualityControlResultService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deliveryId'] && !changes['deliveryId'].firstChange) {
      this.loadRules();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  asControl(ruleKey: string): FormControl {
    return this.form.get(ruleKey) as FormControl;
  }

  async onSave(): Promise<void> {
    if (this.saving || this.readOnly || !this.form.valid || !this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.preSave) {
      const result = this.preSave();
      const allowed = result instanceof Observable ? await firstValueFrom(result) : await result;
      if (!allowed) {
        return;
      }
    }

    const payload = buildResultPayload(this.rules, this.form, {
      deliveryId: this.deliveryId || undefined,
      filtrationOperationId: this.filtrationOperationId || undefined,
      traceabilityLotId: this.traceabilityLotId || undefined
    });

    if (payload.length === 0) {
      this.toast.warning('AUTO.AUCUN_RESULTAT_A_ENREGISTRER');
      return;
    }

    this.saving = true;
    const request$ = this.resolveSaveRequest(payload);

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.toast.success('AUTO.RESULTATS_CREES_AVEC_SUCCES');
        this.readOnly = true;
        this.form.disable();
        this.saved.emit();
      },
      error: () => {
        const msg = 'AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DES_RESULTATS';
        this.toast.error(msg);
        this.saveFailed.emit(msg);
      }
    });
  }

  private loadRules(): void {
    this.loading = true;
    this.message = '';

    const rules$ = this.context === 'RECEPTION_OLIVE' ? this.qcRuleService.getAllOliveRules() : this.qcRuleService.getAllOilRules();

    rules$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (response) => {
        this.rules = (response?.data || []).filter((rule) => !!rule?.ruleKey);
        if (this.rules.length === 0) {
          this.message = 'Aucune règle QC configurée pour ce tenant';
          return;
        }
        this.loadExistingResults();
      },
      error: () => {
        this.message = 'Erreur lors du chargement des critères QC';
      }
    });
  }

  private loadExistingResults(): void {
    if (this.context === 'FILTRATION' && this.filtrationOperationId) {
      this.qcResultService.getResultsByFiltration(this.filtrationOperationId).subscribe({
        next: (res) => {
          this.existingResults = this.normalizeResults(res?.data);
          this.readOnly = this.existingResults.length > 0;
          this.buildForm();
        },
        error: () => this.buildForm()
      });
      return;
    }

    if (this.deliveryId && this.context !== 'OIL_FROM_OLIVE') {
      this.qcResultService.getAllResultsByDeliveryID(this.deliveryId).subscribe({
        next: (res) => {
          this.existingResults = this.normalizeResults(res?.data);
          this.readOnly = this.existingResults.length > 0;
          this.buildForm();
        },
        error: () => this.buildForm()
      });
      return;
    }

    this.buildForm();
  }

  private buildForm(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];

    this.form = buildQcFormControls(this.rules, this.existingResults, this.readOnly);
    this.refreshSummary();

    this.subs.push(this.form.valueChanges.subscribe(() => this.refreshSummary()));
  }

  private refreshSummary(): void {
    const isOilContext = this.context !== 'RECEPTION_OLIVE';
    this.summary = buildQcChecklist(this.rules, this.form.getRawValue(), isOilContext);
  }

  private normalizeResults(
    data: QualityControlResultDto | QualityControlResultDto[] | QualityControlResultDto[][] | null | undefined
  ): QualityControlResultDto[] {
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0])) {
        return (data as QualityControlResultDto[][]).flat();
      }
      return data as QualityControlResultDto[];
    }
    return [data];
  }

  private resolveSaveRequest(payload: QualityControlResultDto[]): Observable<ApiResponse<unknown>> {
    if (this.context === 'OIL_FROM_OLIVE' && this.oliveIdx) {
      return this.qcResultService.saveResultsWithIdx(this.oliveIdx, payload, this.storageUnitId || null) as Observable<
        ApiResponse<unknown>
      >;
    }
    if (this.context === 'FILTRATION' && this.filtrationOperationId) {
      return this.qcResultService.saveResultsForFiltration(this.filtrationOperationId, payload) as Observable<ApiResponse<unknown>>;
    }
    return this.qcResultService.createResults(payload) as Observable<ApiResponse<unknown>>;
  }
}

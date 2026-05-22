import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

import { QualityControlRule } from '../../../shared/models/quality-control-rule';
import { QualityControlRuleService } from '../../../shared/services/quality-control-rule.service';
import { QualityControlResultService } from '../../../shared/services/quality-control-result.service';
import { QualityControlResultDto } from '../../../shared/models/QualityControlResultDto';
import { ToastService } from '../../../shared/services/toast.service';

interface FiltrationQcDialogData {
  filtrationOperationId: string;
  traceabilityLotId?: string | null;
}

@Component({
  selector: 'app-filtration-qc-entry-dialog',
  standalone: true,
  templateUrl: './filtration-qc-entry-dialog.component.html',
  styleUrls: ['./filtration-qc-entry-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class FiltrationQcEntryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly qcRuleService = inject(QualityControlRuleService);
  private readonly qcResultService = inject(QualityControlResultService);
  private readonly toast = inject(ToastService);

  readonly form: FormGroup = this.fb.group({});
  rules: QualityControlRule[] = [];
  loading = false;
  saving = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: FiltrationQcDialogData,
    private readonly dialogRef: MatDialogRef<FiltrationQcEntryDialogComponent>
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: QualityControlResultDto[] = this.rules
      .map((rule) => {
        const value = this.form.get(rule.ruleKey)?.value;
        if (value === null || value === undefined || value === '') {
          return null;
        }

        return {
          rule,
          measuredValue: String(value),
          filtrationOperationId: this.data.filtrationOperationId,
          traceabilityLotId: this.data.traceabilityLotId || undefined
        } as QualityControlResultDto;
      })
      .filter((item): item is QualityControlResultDto => !!item);

    if (payload.length === 0) {
      this.toast.warning('Aucun resultat a enregistrer.');
      return;
    }

    this.saving = true;
    this.qcResultService.saveResultsForFiltration(this.data.filtrationOperationId, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          this.toast.error('Erreur lors de l enregistrement du controle qualite.');
        }
      });
  }

  ruleLabel(rule: QualityControlRule): string {
    return rule.ruleName || rule.ruleKey;
  }

  stringOptions(rule: QualityControlRule): string[] {
    const allowed = rule.ruleTextValue || rule.rawStringValue;
    if (!allowed) {
      return [];
    }
    return allowed
      .split(',')
      .map((v) => v.trim())
      .filter((v) => !!v);
  }

  asControl(ruleKey: string): FormControl {
    return this.form.get(ruleKey) as FormControl;
  }

  private loadRules(): void {
    this.loading = true;
    this.qcRuleService.getAllOilRules()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.rules = (response?.data || []).filter((rule) => !!rule.ruleKey);
          this.buildForm();
        },
        error: () => {
          this.toast.error('Erreur lors du chargement des regles qualite.');
        }
      });
  }

  private buildForm(): void {
    this.rules.forEach((rule) => {
      const validators = [Validators.required];
      if (rule.ruleType === 'NUMERIC') {
        if (rule.minValue !== undefined && rule.minValue !== null) {
          validators.push(Validators.min(rule.minValue));
        }
        if (rule.maxValue !== undefined && rule.maxValue !== null) {
          validators.push(Validators.max(rule.maxValue));
        }
      }

      this.form.addControl(rule.ruleKey, new FormControl(null, validators));
    });
  }
}

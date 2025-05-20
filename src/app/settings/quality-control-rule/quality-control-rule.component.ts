import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';
import {SharedModule} from '../../demo/shared/shared.module';
import {QualityControlRule} from '../../shared/models/quality-control-rule';
import {QualityControlRuleService} from '../../shared/services/quality-control-rule.service';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-quality-control-rule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    SharedModule
  ],
  templateUrl: './quality-control-rule.component.html',
  styleUrls: ['./quality-control-rule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QualityControlRuleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ruleForm: FormGroup;
  dataSource = new MatTableDataSource<QualityControlRule>([]);
  displayedColumns = ['ruleKey', 'Oil QC', 'ruleType', 'ruleName', 'minValue', 'maxValue', 'actions'] as const;
  formOpen = false;
  isEditing = false;
  message = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private service: QualityControlRuleService,
    private snackBar: MatSnackBar
  ) {
    this.ruleForm = this.fb.group({
      id: [''],
      ruleKey: ['', Validators.required],
      oilQc:  [false],
      ruleType: ['numeric', Validators.required],
      booleanValue: [false],
      minValue: [0, Validators.required],
      maxValue: [0, Validators.required],
      ruleName: ['', Validators.required],
      description: [''],
      textInput:    [[]] // valeurs séparées par virgule si ruleType === text
    });
    this.ruleForm.get('ruleType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        const boolCtrl = this.ruleForm.get('booleanValue')!;
        const minCtrl = this.ruleForm.get('minValue')!;
        const maxCtrl = this.ruleForm.get('maxValue')!;
        if (type === 'numeric') {
          minCtrl.setValidators([Validators.required]);
          maxCtrl.setValidators([Validators.required]);
          boolCtrl.clearValidators();
        } else {
          boolCtrl.setValidators([Validators.required]);
          minCtrl.clearValidators();
          maxCtrl.clearValidators();
        }
        boolCtrl.updateValueAndValidity();
        minCtrl.updateValueAndValidity();
        maxCtrl.updateValueAndValidity();
      });
  }

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.isLoading = true;
    this.service.getAllRules().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe(
      res => {
        if (res?.success) {
          this.dataSource.data = Array.isArray(res.data[0]) ? res.data[0] : res.data;
          this.message = '';
        } else {
          this.message = res.message;
        }
      },
      () => this.message = 'Failed to load rules.'
    );
  }

  openForm(edit?: QualityControlRule): void {
    if (edit) {
      this.ruleForm.reset({
        id:           edit.id ?? '',
        ruleKey:      edit.ruleKey,
        oilQc:        edit.oilQc ?? false,
        ruleType:     (edit.ruleType ?? 'numeric').toLowerCase(),
        booleanValue: edit.booleanValue ?? false,
        minValue:     edit.minValue ?? 0,
        maxValue:     edit.maxValue ?? 0,
        ruleName:     edit.ruleName ?? '',
        description:  edit.description ?? '',
        textInput:    Array.isArray(edit.textValues) ? edit.textValues.join(', ') : ''
      });
      this.isEditing = true;
    } else {
      this.ruleForm.reset({
        id:           '',
        ruleKey:      '',
        oilQc:        false,
        ruleType:     'numeric',
        booleanValue: false,
        minValue:     0,
        maxValue:     0,
        ruleName:     '',
        description:  '',
        textInput:    ''
      });
      this.isEditing = false;
    }

    this.formOpen = true;
  }

  cancel(): void {
    this.formOpen = false;
    this.isEditing = false;
    this.message = '';
  }

  onSubmit(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const v = this.ruleForm.value;
    const ruleType = v.ruleType;

    const payload: any = {
      id:           v.id,
      ruleKey:      v.ruleKey,
      oilQc:        v.oilQc,
      ruleType:     ruleType,
      ruleName:     v.ruleName,
      description:  v.description,
      minValue:     ruleType === 'numeric' ? v.minValue : null,
      maxValue:     ruleType === 'numeric' ? v.maxValue : null,
      booleanValue: ruleType === 'boolean' ? v.booleanValue : null,
      textValues: ruleType?.toLowerCase() === 'string'
        ? (v.textInput?.split(',').map((val: string) => val.trim()).filter((val: string) => val !== ''))
        : null
    };

    this.isLoading = true;

    const op$ = this.isEditing
      ? this.service.updateRule(payload)
      : this.service.createRule(payload);

    op$.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (res) => {
        if (res?.success) {
          this.snackBar.open('Règle enregistrée avec succès ✅', 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['snackbar-success']
          });
          this.loadRules();
          this.cancel();
        } else {
          this.snackBar.open('Échec de l\'enregistrement ❌', 'Fermer', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['snackbar-error']
          });
        }
      },
      error: () => {
        this.snackBar.open('Erreur de communication avec le serveur ⚠️', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
  deleteRule(rule: QualityControlRule): void {
    if (!rule.id) return;
    this.isLoading = true;
    this.service.deleteRule(rule.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe(
      res => {
        if (res?.success) this.loadRules();
      },
      () => this.message = 'Delete failed.'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

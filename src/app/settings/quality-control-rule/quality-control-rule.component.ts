import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { SharedModule } from '../../demo/shared/shared.module';
import { QualityControlRule } from '../../shared/models/quality-control-rule';
import { QualityControlRuleService } from '../../shared/services/quality-control-rule.service';

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
    private service: QualityControlRuleService
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
      description: ['']
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
        id:           edit.id        ?? '',
        ruleKey:      edit.ruleKey,
        oilQc:        edit.oilQc     ?? false,
        ruleType:     (edit.ruleType ?? 'numeric').toLowerCase(),
        booleanValue: edit.booleanValue ?? false,
        minValue:     edit.minValue  ?? 0,
        maxValue:     edit.maxValue  ?? 0,
        ruleName:     edit.ruleName  ?? '',
        description:  edit.description ?? ''
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
        description:  ''
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
    const payload: any = {
      id:           v.id,
      ruleKey:      v.ruleKey,
      oilQc:        v.oilQc,
      ruleType:     v.ruleType,
      ruleName:     v.ruleName,
      description:  v.description,
      minValue:     v.ruleType === 'numeric' ? v.minValue : null,
      maxValue:     v.ruleType === 'numeric' ? v.maxValue : null,
      booleanValue: v.ruleType === 'boolean' ? v.booleanValue : null
    };
    this.isLoading = true;
    const op$ = this.isEditing
      ? this.service.updateRule(payload)
      : this.service.createRule(payload);
    op$.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe(
      res => {
        if (res?.success) this.loadRules();
        this.cancel();
      },
      () => this.message = 'Operation failed.'
    );
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

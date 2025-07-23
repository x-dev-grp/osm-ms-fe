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
import { ToastService } from '../../shared/services/toast.service';
import {OsmDashboard} from "../../shared/modules/osm-dashboard/osm-dashboard";
import {Action, DashboardConfig} from "../../shared/modules/osm-dashboard/models/dashboard-config";
import {Router} from "@angular/router";
import {QUALTITY_CONTROL_RULE_DASHBOARD} from "./QUALTITY_CONTROL_RULE_DASHBOARD";

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
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './quality-control-rule.component.html',
  styleUrls: ['./quality-control-rule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QualityControlRuleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ruleForm: FormGroup;
  dataSource = new MatTableDataSource<QualityControlRule>([]);
  displayedColumns = ['ruleName', 'ruleType', 'oilQc', 'actions'] as const;
  formOpen = false;
  isEditing = false;
  message = '';
  isLoading = false;

  dashboardConfig: DashboardConfig = QUALTITY_CONTROL_RULE_DASHBOARD;


  constructor(
    private fb: FormBuilder,
    private service: QualityControlRuleService,
    private toastService: ToastService,
    private router: Router
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
          this.toastService.success('Règle enregistrée avec succès ✅');
          // this.loadRules();
          this.cancel();
        } else {
          this.toastService.error("Échec de l'enregistrement ❌");
        }
      },
      error: () => {
        this.toastService.error('Erreur de communication avec le serveur ⚠️');
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
        // if (res?.success) this.loadRules();
      },
      () => this.message = 'Delete failed.'
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRowAction(e: { row: QualityControlRule; action: Action }): void {

    switch (e.action.value) {
      case 'CONSULTER':
        this.viewRule(e.row);
        break;
      case 'MODIFIER':
        this.selectRule(e.row);
        break;

      case 'Supprimer':
        if (e.row.id) this.deleteRule(e.row);
        break;

    }
  }

  // private deleteRule(r: QualityControlRule): void {
  //   // this.deliveryService.deleteUnifiedDelivery(r.id!).subscribe(
  //   //   res => {
  //   //     if (res.success) {
  //   //       this.fetchDeliveries();
  //   //       this.toast('Réception supprimée avec succès.');
  //   //     }
  //   //   },
  //   //   () => this.toast('Erreur lors de la suppression.')
  //   // );
  // }

  selectRule(r?: QualityControlRule): void {
    if (r?.id) {
      this.router.navigate(['/settings/quality-control', r.id]);
    } else {
      this.router.navigate(['/settings/quality-control', 'new']);
    }
  }


  viewRule(r: QualityControlRule): void {
    this.router.navigate(['settings/quality-control-rule-details', r.id]);
  }

}

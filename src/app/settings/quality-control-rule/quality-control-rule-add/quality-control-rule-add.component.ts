import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {QualityControlRuleService} from "../../../shared/services/quality-control-rule.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {finalize, takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {QualityControlRule} from "../../../shared/models/quality-control-rule";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {NgIf} from "@angular/common";
import {CardComponent} from "../../../theme/components/card/card.component";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-quality-control-rule-add',
  standalone: true,
  imports: [
     MatFormField,
    MatCheckbox,
    MatSelect,
    MatOption,
    MatProgressSpinner,
    NgIf,
    CardComponent,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatIconButton,
    MatButton,
     MatInput,
    MatLabel ],
  templateUrl: './quality-control-rule-add.component.html',
  styleUrl: './quality-control-rule-add.component.scss'
})
export class QualityControlRuleAddComponent implements OnInit {
  ruleForm: FormGroup;
  private destroy$ = new Subject<void>();
  formOpen = false;
  isEditing = false;
  message = '';
  isLoading = false;
  loading: boolean = false;
  errorMessage: string | null = null;


  constructor(
    private fb: FormBuilder,
    private service: QualityControlRuleService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.loading = true;
    const ruleID = this.route.snapshot.paramMap.get('id');
    this.isEditing = ruleID !== null && ruleID !== 'new';

    //  Initialiser le formulaire dès le début
    this.initForm();
    // Si c'est une modification, charger les données
    if (this.isEditing && ruleID) {
      this.loadRuleData(ruleID).then(() => {
        this.loading = false;
      }).catch((error) => {
        this.errorMessage = 'Erreur lors du chargement de la règle.';
        console.error(this.errorMessage, error);
        this.toast.error(this.errorMessage);
        this.loading = false;
      });
    } else {
      // En mode création, pas besoin de charger des données supplémentaires
      this.loading = false;
    }
  }

  initForm() {
    this.ruleForm = this.fb.group({
      id: [''],
      ruleKey: ['', Validators.required],
      oilQc: [false],
      ruleType: ['numeric', Validators.required],
      booleanValue: [false],
      minValue: [0, [Validators.required, Validators.min(0)]],
      maxValue: [0, [Validators.required, Validators.min(0)]],
      ruleName: ['', Validators.required],
      description: [''],
      textInput: [[], []] // Initialisé sans validateur ici, géré dynamiquement
    });

    const ruleTypeCtrl = this.ruleForm.get('ruleType');
    const boolCtrl = this.ruleForm.get('booleanValue')!;
    const minCtrl = this.ruleForm.get('minValue')!;
    const maxCtrl = this.ruleForm.get('maxValue')!;
    const textInputCtrl = this.ruleForm.get('textInput')!;

    // Gestion des validateurs selon le type de règle
    ruleTypeCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        if (type === 'numeric') {
          minCtrl.setValidators([Validators.required]);
          maxCtrl.setValidators([Validators.required]);
          boolCtrl.clearValidators();
          textInputCtrl.clearValidators();
        } else if (type === 'boolean') {
          boolCtrl.setValidators([Validators.required]);
          minCtrl.clearValidators();
          maxCtrl.clearValidators();
          textInputCtrl.clearValidators();
        } else if (type === 'string') {
          textInputCtrl.setValidators([Validators.required]);
          minCtrl.clearValidators();
          maxCtrl.clearValidators();
          boolCtrl.clearValidators();
        }

        // Mettre à jour les validations
        boolCtrl.updateValueAndValidity();
        minCtrl.updateValueAndValidity();
        maxCtrl.updateValueAndValidity();
        textInputCtrl.updateValueAndValidity();
      });

    // Déclenche une première mise à jour des validateurs
    ruleTypeCtrl?.setValue(ruleTypeCtrl?.value); // ou appeler .updateValueAndValidity()
  }
  private async loadRuleData(ruleID: string): Promise<void> {
    try {
      const res = await this.service.getRule(ruleID).toPromise();
      if (res?.success && res.data) {
        this.patchForm(res.data[0]);
      } else {
        throw new Error('Données introuvables');
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement de la règle.';
      console.error(this.errorMessage, error);
      this.toast.error(this.errorMessage);
      this.router.navigate(['/settings/quality-control']); // Rediriger si erreur
      throw error;
    }
  }

  save(): void {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const v = this.ruleForm.value;
    const ruleType = v.ruleType;

    const payload = {
      id: v.id,
      ruleKey: v.ruleKey,
      oilQc: v.oilQc,
      ruleType: ruleType,
      ruleName: v.ruleName,
      description: v.description,
      minValue: ruleType === 'numeric' ? v.minValue : null,
      maxValue: ruleType === 'numeric' ? v.maxValue : null,
      booleanValue: ruleType === 'boolean' ? v.booleanValue : null,
      ruleTextValue: ruleType?.toLowerCase() === 'string'
        ? Array.isArray(v.textInput)
          ? v.textInput.filter((val: string) => val && val.trim()).join(',') // 👈 on convertit en string
          : String(v.textInput || '').trim()
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
          this.toast.success('Règle enregistrée avec succès ✅' );
          this.router.navigate(['/settings/quality-control']);
          // this.loadRules();
          this.cancel();
        } else {
          this.toast.error('Échec de l\'enregistrement ❌' );
        }
      },
      error: () => {
        this.toast.error('Erreur de communication avec le serveur ⚠️' );
      }
    });
  }



  private patchForm(data: QualityControlRule): void {
    this.ruleForm.patchValue({
      id: data.id,
      ruleKey: data.ruleKey,
      oilQc: data.oilQc ?? false,
      ruleType: data.ruleType ? data.ruleType.toLowerCase() : 'numeric',
      booleanValue: data.booleanValue,
      numericValue: data.numericValue,
      ruleName: data.ruleName ?? '',
      description: data.description ?? '',
      minValue: data.minValue ?? 0,
      maxValue: data.maxValue ?? 0,
      measuredValue: data.measuredValue,
      textInput: data.ruleTextValue ? data.ruleTextValue.split(',').map(v => v.trim()) : []
    });
  }


  cancel(): void {
    this.formOpen = false;
    this.isEditing = false;
    this.message = '';
  }


  onBack(): void {
    window.history.back();
  }
  resetForm(): void {
    this.router.navigate(['/settings/quality-control']);
  }

}

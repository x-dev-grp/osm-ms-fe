import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { isAboveVirginCoiLimit, isTunisiaDefaultRule } from '../../../shared/qc/utils/tunisia-qc-defaults.util';

@Component({
  selector: 'app-quality-control-rule-add',
  standalone: true,
  imports: [TranslateModule,
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
    MatLabel,
    SharedModule ],
  templateUrl: './quality-control-rule-add.component.html',
  styleUrl: './quality-control-rule-add.component.scss'
})
export class QualityControlRuleAddComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  ruleForm: FormGroup;
  private destroy$ = new Subject<void>();
  formOpen = false;
  isEditing = false;
  message = '';
  isLoading = false;
  loading: boolean = false;
  errorMessage: string | null = null;
  isTunisiaDefault = false;


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
        this.errorMessage = this.i18n.instant('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_CRITERE');
        console.error(this.errorMessage, error);
        this.toast.error(this.errorMessage!);
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
      ruleName: ['', Validators.required],
      ruleType: [''],
      minValue: [null],
      maxValue: [null],
      booleanValue: [false],
      description: [''],
      textInput: [''] // no validators by default
    });
    // Toggle validators + force empty string when raw_string
    const ruleTypeCtrl = this.ruleForm.get('ruleType')!;
    const textCtrl = this.ruleForm.get('textInput')!;

    ruleTypeCtrl.valueChanges.subscribe((type: string) => {
      if (type === 'string') {
        textCtrl.setValidators([Validators.required, Validators.maxLength(255)]);
        if (textCtrl.value == null) textCtrl.setValue('');
      }  else {
        textCtrl.clearValidators();
      }
      textCtrl.updateValueAndValidity({ emitEvent: false });
    });

    const boolCtrl = this.ruleForm.get('booleanValue')!;
    const minCtrl = this.ruleForm.get('minValue')!;
    const maxCtrl = this.ruleForm.get('maxValue')!;
    const textInputCtrl = this.ruleForm.get('textInput')!;

    // Gestion des validateurs selon le type de critère
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
        this.patchForm(res.data);
      } else {
        throw new Error('Données introuvables');
      }
    } catch (error) {
      this.errorMessage = this.i18n.instant('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_LA_CRITERE');
      console.error(this.errorMessage, error);
      this.toast.error(this.errorMessage!);
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

    if (
      ruleType === 'numeric' &&
      isAboveVirginCoiLimit(v.ruleKey, v.maxValue)
    ) {
      this.toast.warning('La valeur max dépasse les limites COI/Tunisia (vierge)');
    }

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
          this.toast.success();
          this.router.navigate(['/settings/quality-control']);
          // this.loadRules();
          this.cancel();
        } else {
          this.toast.error('AUTO.ECHEC_DE_L_ENREGISTREMENT' );
        }
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_DE_COMMUNICATION_AVEC_LE_SERVEUR' );
      }
    });
  }



  private patchForm(data: any): void {
    this.isTunisiaDefault = isTunisiaDefaultRule(data.description);
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
      textInput: data.ruleTextValue ? data.ruleTextValue.split(',').map((v: string) => v.trim()) : []
    });
  }


  cancel(): void {
    this.router.navigate(['/settings/quality-control']);

  }

}

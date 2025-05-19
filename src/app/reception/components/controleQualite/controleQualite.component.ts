import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { QualityControlRuleService } from '../../../shared/services/quality-control-rule.service';
import { QualityControlRule } from '../../../shared/models/quality-control-rule';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { QualityControlResultService } from '../../../shared/services/quality-control-result.service';
import { QualityControlResultDto } from '../../../shared/models/QualityControlResultDto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {MatFormField} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-controlequalite',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormField, MatSelect, MatOption],
  templateUrl: './controleQualite.component.html',
  styleUrls: ['./controleQualite.component.scss'],
  standalone: true
})
export class ControleQualiteComponent implements OnInit {
  message: string = '';
  rules: QualityControlRule[] = [];
  dynamicForm!: FormGroup;
  receptionId: string | null = null;
  deliveryData: UnifiedDelivery | undefined;
  submitted = false;
  isLoading = false;
  qualityControlResults: QualityControlResultDto[] = [];


  constructor(
    private fb: FormBuilder,
    private qcService: QualityControlRuleService,
    private qcResService: QualityControlResultService,
    private route: ActivatedRoute,
    private deliveryService: UnifiedDeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    this.loadReception();
  }

  loadReception(): void {
    if (!this.receptionId) {
      this.message = 'ID de réception manquant';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.deliveryService.getUnifiedDelivery(this.receptionId).subscribe({
      next: (response) => {
        this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
        console.log('Delivery Data:', this.deliveryData);
        this.loadRules();
      },
      error: (error) => {
        console.error('Erreur réception:', error);
        this.message = 'Erreur lors du chargement des données de réception';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRules(): void {
    this.qcService.getAllRules().subscribe({
      next: (res) => {
        if (res?.success) {
          let allRules: QualityControlRule[] = [];

          if (Array.isArray(res.data)) {
            allRules = Array.isArray(res.data[0]) ? res.data[0] : res.data;
          } else {
            allRules = res.data ? [res.data] : [];
          }

          this.rules = this.filterRules(allRules);
          console.log('Filtered Rules:', this.rules);

          if (this.rules.length > 0) {
            this.loadQualityControlResults();
          } else {
            this.message = 'Aucune règle applicable trouvée pour ce type de livraison';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        } else {
          this.rules = [];
          this.message = res.message || 'Aucune règle trouvée';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur chargement règles:', error);
        this.rules = [];
        this.message = 'Erreur lors du chargement des règles';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadQualityControlResults(): void {
    if (!this.deliveryData?.id) {
      this.message = 'ID de livraison non disponible';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.qcResService.getAllResultsByDeliveryID(this.deliveryData.id).subscribe({
      next: (res) => {
        this.qualityControlResults = res.data || [];
        console.log('Quality Control Results:', this.qualityControlResults);
        this.createDynamicForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur chargement résultats:', error);
        this.message = 'Erreur lors du chargement des résultats de contrôle qualité';
        this.isLoading = false;
        this.createDynamicForm();
        this.cdr.detectChanges();
      }
    });
  }

  createDynamicForm(): void {
    const group: { [key: string]: FormControl } = {};

    this.rules.forEach((rule) => {
      const validators = [Validators.required];
      let initialValue: number | boolean | string | null = null;

      const existingResult = this.qualityControlResults.find(
        (result) => result.rule?.ruleKey === rule.ruleKey
      );
      if (existingResult) {
        switch (rule.ruleType) {
          case 'NUMERIC':
            initialValue = Number(existingResult.measuredValue);
            break;
          case 'BOOLEAN':
            initialValue = existingResult.measuredValue === 'true';
            break;
          case 'TEXT':
            initialValue = existingResult.measuredValue || null;
            break;
        }
      }

      // Gérer les types de validation
      if (rule.ruleType === 'NUMERIC') {
        if (rule.minValue !== undefined && rule.minValue !== null) {
          validators.push(Validators.min(rule.minValue));
        }
        if (rule.maxValue !== undefined && rule.maxValue !== null) {
          validators.push(Validators.max(rule.maxValue));
        }
      }
      group[rule.ruleKey] = new FormControl(initialValue, validators);
    });

    this.dynamicForm = this.fb.group(group);
  }
  getRuleName(key: string): string {
    const r = this.rules.find(rule => rule.ruleKey === key);
    return r ? r.ruleName! : key;
  }

  getTextOptions(ruleKey: string): string[] {
    const rule = this.rules.find(r => r.ruleKey === ruleKey);
    return (rule?.textValues || '').toString().split(',').map(v => v.trim());
  }


  getRuleTextValues(ruleKey: string): string[] {
    const rule = this.rules.find(r => r.ruleKey === ruleKey);
    return rule?.textValues || [];
  }



  getRuleMinValue(ruleKey: string): number | null {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    return rule?.minValue !== undefined ? rule.minValue : null;
  }

  getRuleMaxValue(ruleKey: string): number | null {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    return rule?.maxValue !== undefined ? rule.maxValue : null;
  }

  isBooleanSelect(ruleKey: string): boolean {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    return rule?.booleanValue === true;
  }

  getRuleType(ruleKey: string): 'NUMERIC' | 'BOOLEAN'| 'TEXT' {
    return this.rules.find((r) => r.ruleKey === ruleKey)?.ruleType || 'NUMERIC';
  }

  onSubmit(): void {
    this.submitted = true;

    /* 1. Basic guard rails -------------------------------------------------- */
    if (this.dynamicForm.invalid) {
      this.message = 'Le formulaire contient des erreurs. Veuillez corriger les champs.';
      this.dynamicForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    if (!this.deliveryData?.id) {
      this.message = 'Données de livraison non disponibles.';
      this.cdr.detectChanges();
      return;
    }

    /* 2. Build and separate result payloads ------------------------------- */
    const updates: QualityControlResultDto[] = [];
    const creates: QualityControlResultDto[] = [];

    Object.entries(this.dynamicForm.value as Record<string, unknown>).forEach(([ruleKey, rawValue]) => {
      /* a. Match the rule --------------------------------------------------- */
      const rule = this.rules.find((r) => r.ruleKey === ruleKey);
      if (!rule) {
        throw new Error(`Aucune règle trouvée pour la clé : ${ruleKey}`);
      }

      /* b. Validate the measured value ------------------------------------- */
      if (rule.ruleType === 'NUMERIC' && (typeof rawValue !== 'number' || isNaN(rawValue as number))) {
        throw new Error(`Valeur mesurée invalide pour la règle numérique : ${ruleKey}`);
      }
      if (rule.ruleType === 'BOOLEAN' && typeof rawValue !== 'boolean') {
        throw new Error(`Valeur mesurée invalide pour la règle booléenne : ${ruleKey}`);
      }

      /* c. Find existing result, if any ------------------------------------- */
      const existingResult = this.qualityControlResults.find((result) => result.rule?.ruleKey === ruleKey);

      /* d. Create DTO and categorize --------------------------------------- */
      const dto: QualityControlResultDto = {
        id: existingResult?.id,
        rule: rule,
        measuredValue: String(rawValue), // Convert to string for backend
        delivery: this.deliveryData!
      };

      if (existingResult?.id) {
        updates.push(dto);
        console.log(`Preparing update for ruleKey: ${ruleKey}, id: ${existingResult.id}`);
      } else {
        creates.push(dto);
        console.log(`Preparing create for ruleKey: ${ruleKey}`);
      }
    });

    /* 3. Persist updates and creates --------------------------------------- */
    this.isLoading = true;
    this.message = '';

    const requests: Observable<{ success: boolean; message?: string }>[] = [];

    if (updates.length > 0) {
      requests.push(
        this.qcResService.updateResults(updates).pipe(
          catchError((err) => {
            console.error('Erreur lors de la mise à jour:', err);
            return of({ success: false, message: err.error?.message || 'Erreur lors de la mise à jour des résultats.' });
          })
        )
      );
    }

    if (creates.length > 0) {
      requests.push(
        this.qcResService.createResults(creates).pipe(
          catchError((err) => {
            console.error('Erreur lors de la création:', err);
            return of({ success: false, message: err.error?.message || 'Erreur lors de la création des résultats.' });
          })
        )
      );
    }

    if (requests.length === 0) {
      this.message = 'Aucun résultat à enregistrer.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    forkJoin(requests).subscribe({
      next: (responses) => {
        const allSuccessful = responses.every((res) => res.success);
        const anySuccessful = responses.some((res) => res.success);

        if (allSuccessful) {
          if (updates.length > 0 && creates.length > 0) {
            this.message = 'Résultats de contrôle qualité mis à jour et créés avec succès.';
          } else if (updates.length > 0) {
            this.message = 'Résultats de contrôle qualité mis à jour avec succès.';
          } else {
            this.message = 'Résultats de contrôle qualité créés avec succès.';
          }
          this.dynamicForm.reset();
          this.submitted = false;
          this.loadQualityControlResults(); // Reload results to reflect updates
        } else {
          this.message = anySuccessful
            ? 'Certains résultats ont été enregistrés, mais des erreurs sont survenues.'
            : responses.map((res) => res.message).join(' ');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement:", err);
        this.message = "Erreur lors de l'enregistrement des résultats de contrôle qualité.";
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  private filterRules(allRules: QualityControlRule[]): QualityControlRule[] {
    if (!this.deliveryData?.deliveryType) {
      return [];
    }

    switch (this.deliveryData.deliveryType) {
      case 'OIL':
        return allRules.filter((rule) => rule.oilQc === true);
      case 'OLIVE':
        return allRules.filter((rule) => rule.oilQc === false || rule.oilQc === null);
      default:
        return [];
    }
  }


}

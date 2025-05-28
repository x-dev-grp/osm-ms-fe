import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {QualityControlRuleService} from '../../../shared/services/quality-control-rule.service';
import {QualityControlRule} from '../../../shared/models/quality-control-rule';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {QualityControlResultService} from '../../../shared/services/quality-control-result.service';
import {QualityControlResultDto} from '../../../shared/models/QualityControlResultDto';
import {forkJoin, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {MatFormField} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatSnackBar} from "@angular/material/snack-bar";
import { CardComponent } from '../../../@theme/components/card/card.component';

@Component({
  selector: 'app-controlequalite',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormField, MatSelect, MatOption, CardComponent],
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
  isQualityControlDone: boolean = false; // verfifier si le controle qualité est deja fait!

  constructor(
    private fb: FormBuilder,
    private qcService: QualityControlRuleService,
    private qcResService: QualityControlResultService,
    private route: ActivatedRoute,
    private deliveryService: UnifiedDeliveryService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
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

        // S'il existe au moins un résultat => QC déjà fait => champs readonly
        this.isQualityControlDone = this.qualityControlResults.length > 0;

        this.createDynamicForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur chargement résultats:', error);
        this.message = 'Erreur lors du chargement des résultats de contrôle qualité';
        this.isLoading = false;
        this.isQualityControlDone = false;
        this.createDynamicForm();
        this.cdr.detectChanges();
      }
    });
  }

  createDynamicForm(): void {
    const group: { [key: string]: FormControl } = {};

    this.rules.forEach((rule) => {
      const validators = [Validators.required];
      let initialValue: any = null;

      // Recherche d'une réponse existante pour cette règle
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
          case 'STRING':
            initialValue = existingResult.measuredValue || '';
            break;
        }
      }

      // Gestion spéciale pour STRING avec valeurs définies
      if (rule.ruleType === 'STRING' && rule.ruleTextValue) {
        // On ne met pas de validateur ici car on force le choix parmi les valeurs proposées via select
        initialValue = initialValue || '';
      }

      if (rule.ruleType === 'NUMERIC') {
        if (rule.minValue !== undefined && rule.minValue !== null) {
          validators.push(Validators.min(rule.minValue));
        }
        if (rule.maxValue !== undefined && rule.maxValue !== null) {
          validators.push(Validators.max(rule.maxValue));
        }
      }

      group[rule.ruleKey] = new FormControl(
        {value: initialValue, disabled: this.isQualityControlDone},
        rule.ruleType === 'STRING' && rule.ruleTextValue ? [] : validators
      );
    });

    this.dynamicForm = this.fb.group(group);

    // S'abonner pour mettre à jour la catégorie automatiquement
    this.dynamicForm.valueChanges.subscribe(() => {
      this.updateCategorie();
    });
  }

  getRuleType(ruleKey: string): 'NUMERIC' | 'BOOLEAN' | 'STRING' {
    return this.rules.find((r) => r.ruleKey === ruleKey)?.ruleType || 'NUMERIC';
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.dynamicForm.invalid) {
      this.message = 'Le formulaire contient des erreurs. Veuillez corriger les champs.';
      this.dynamicForm.markAllAsTouched();
      this.cdr.detectChanges();

      this.snackBar.open('Le formulaire contient des erreurs.', 'Fermer', {
        duration: 4000,
        panelClass: ['mat-snack-bar-container-error']
      });
      return;
    }

    if (!this.deliveryData?.id) {
      this.message = 'Données de livraison non disponibles.';
      this.cdr.detectChanges();

      this.snackBar.open('Données de livraison manquantes.', 'Fermer', {
        duration: 4000,
        panelClass: ['mat-snack-bar-container-warning']
      });
      return;
    }

    const updates: QualityControlResultDto[] = [];
    const creates: QualityControlResultDto[] = [];

    Object.entries(this.dynamicForm.value as Record<string, unknown>).forEach(([ruleKey, rawValue]) => {
      const rule = this.rules.find((r) => r.ruleKey === ruleKey);
      if (!rule) throw new Error(`Aucune règle trouvée pour la clé : ${ruleKey}`);

      // Validation par type
      let isValid = false;
      if (rule.ruleType === 'NUMERIC') {
        isValid = typeof rawValue === 'number' && !isNaN(rawValue);
      } else if (rule.ruleType === 'BOOLEAN') {
        isValid = typeof rawValue === 'boolean';
      } else if (rule.ruleType === 'STRING') {
        isValid = typeof rawValue === 'string' && rawValue.trim() !== '';
      }

      if (!isValid) {
        throw new Error(`Valeur mesurée invalide pour la règle : ${ruleKey}`);
      }

      const existingResult = this.qualityControlResults.find(
        (result) => result.rule?.ruleKey === ruleKey
      );

      const dto: QualityControlResultDto = {
        id: existingResult?.id,
        rule: rule,
        measuredValue: String(rawValue),
        deliveryId: this.deliveryData!.id // ✅ Envoie uniquement l'ID
      };

      if (existingResult?.id) {
        updates.push(dto);
      } else {
        creates.push(dto);
      }
    });

    this.isLoading = true;

    const requests: Observable<{ success: boolean; message?: string }>[] = [];

    if (updates.length > 0) {
      requests.push(
        this.qcResService.updateResults(updates).pipe(
          catchError((err) => {
            console.error('Erreur lors de la mise à jour:', err);
            return of({success: false, message: 'Erreur lors de la mise à jour des résultats.'});
          })
        )
      );
    }

    if (creates.length > 0) {
      requests.push(
        this.qcResService.createResults(creates).pipe(
          catchError((err) => {
            console.error('Erreur lors de la création:', err);
            console.log('Payload ajout :', creates);
            return of({success: false, message: 'Erreur lors de la création des résultats.'});
          })
        )
      );
    }

    if (requests.length === 0) {
      this.snackBar.open('Aucun changement à enregistrer.', 'Fermer', {
        duration: 3000,
        panelClass: ['mat-snack-bar-container-info']
      });
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    forkJoin(requests).subscribe({
      next: (responses) => {
        const allSuccessful = responses.every(res => res.success);
        const anySuccessful = responses.some(res => res.success);

        let message = '';
        if (allSuccessful) {
          if (updates.length > 0 && creates.length > 0) {
            message = 'Résultats mis à jour et créés avec succès.';
          } else if (updates.length > 0) {
            message = 'Résultats mis à jour avec succès.';
          } else {
            message = 'Résultats créés avec succès.';
          }

          this.snackBar.open(message, 'Fermer', {
            duration: 4000,
            panelClass: ['mat-snack-bar-container-success']
          });

          this.dynamicForm.reset();
          this.submitted = false;
          this.loadQualityControlResults();

        } else {
          const errorMessage = anySuccessful
            ? 'Certains résultats ont été enregistrés, mais certains échecs sont survenus.'
            : 'Échec de l’enregistrement des résultats.';

          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['mat-snack-bar-container-error']
          });
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement:", err);
        this.snackBar.open("Une erreur serveur est survenue.", "Fermer", {
          duration: 6000,
          panelClass: ['mat-snack-bar-container-critical']
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  private updateCategorie(): void {
    const categorie = this.calculateCategorie();
    this.dynamicForm.get('categorie')?.setValue(categorie, {emitEvent: false});
  }


  getRuleName(key: string): string {
    const r = this.rules.find(rule => rule.ruleKey === key);
    return r ? r.ruleName! : key;
  }

  getTextOptions(ruleKey: string): string[] {
    const rule = this.rules.find(r => r.ruleKey === ruleKey);
    if (!rule || !rule.ruleTextValue) return [];

    return rule.ruleTextValue
      .split(',')
      .map(val => val.trim())
      .filter(val => val.length > 0);
  }


  getRuleMinValue(ruleKey: string): number | null {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    return rule?.minValue !== undefined ? rule.minValue : null;
  }

  getRuleMaxValue(ruleKey: string): number | null {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    return rule?.maxValue !== undefined ? rule.maxValue : null;
  }

  private areRulesAvailable(): boolean {
    const requiredKeys = ['acidite', 'k270', 'k232', 'categorie'];
    return requiredKeys.every(key => this.rules.some(rule => rule.ruleKey === key));
  }
  private calculateCategorie(): string {
    const acidite = this.dynamicForm.get(this.findRuleKey('acidite'))?.value;
    const k270 = this.dynamicForm.get(this.findRuleKey('k270'))?.value;
    const k232 = this.dynamicForm.get(this.findRuleKey('k232'))?.value;

    if (acidite == null || k270 == null || k232 == null) return '';

    if (acidite < 0.8 && k270 < 0.22 && k232 < 2.5) {
      return 'vierge extra';
    } else if (acidite < 2 && k270 < 0.25 && k232 < 2.6) {
      return 'vierge';
    } else {
      return 'lampante';
    }
  }

  private findRuleKey(partialKey: string): string {
    const match = this.rules.find(rule => rule.ruleKey.toLowerCase().includes(partialKey.toLowerCase()));
    return match?.ruleKey || '';
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

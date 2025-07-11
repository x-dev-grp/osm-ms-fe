import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, Inject, Input, OnInit, Optional} from '@angular/core';
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
import {MatFormField, MatFormFieldModule} from '@angular/material/form-field';
import {MatOption, MatSelect, MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {StorageUnitDtoService} from "../../../shared/services/storage.service";
import {StorageUnitDto} from "../../../shared/models/StorageUnitDto";
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Router } from '@angular/router';


@Component({
  selector: 'app-controlequalite',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatFormField, MatSelect, MatOption,  TranslateModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatChipsModule],
  templateUrl: './controleQualite.component.html',
  styleUrls: ['./controleQualite.component.scss'],
  standalone: true
})
export class ControleQualiteComponent implements OnInit {
  @Input() deliveryId: string | null = null;

  message: string = '';
  rules: QualityControlRule[] = [];
  dynamicForm!: FormGroup;
  mainForm!: FormGroup;
  receptionId: string | null = null;
  deliveryData: UnifiedDelivery | undefined;
  submitted = false;
  isLoading = false;
  qualityControlResults: QualityControlResultDto[] = [];
  isQualityControlDone: boolean = false;
  storageUnits: StorageUnitDto[] = [];

  constructor(
    private fb: FormBuilder,
    private qcService: QualityControlRuleService,
    private qcResService: QualityControlResultService,
    private route: ActivatedRoute,
    private deliveryService: UnifiedDeliveryService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private storageUnitService: StorageUnitDtoService,
    private translate: TranslateService,
    private router: Router,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: Record<string, unknown> | null = null
  ) {
    if (dialogData && dialogData['deliveryId']) {
      this.deliveryId = dialogData['deliveryId'] as string;
    }
  }

  ngOnInit(): void {
    this.receptionId = this.deliveryId || this.route.snapshot.paramMap.get('id');
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
        this.loadRules();
      },
      error: () => {
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
      error: () => {
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
        this.isQualityControlDone = this.qualityControlResults.length > 0;
        this.createDynamicForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
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
      let initialValue: number | boolean | string | null = null;
      const existingResult = this.qualityControlResults.find((result) => result.rule?.ruleKey === rule.ruleKey);
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
      if (rule.ruleType === 'STRING' && rule.ruleTextValue) {
        initialValue = initialValue || '';
      }
      group[rule.ruleKey] = new FormControl(
        {value: initialValue, disabled: this.isQualityControlDone},
        rule.ruleType === 'STRING' && rule.ruleTextValue ? [] : validators
      );
    });
    this.dynamicForm = this.fb.group(group);
    this.mainForm = this.fb.group({ ...this.dynamicForm.controls });
    this.mainForm.get('unitPrice')?.valueChanges.subscribe((unitPrice: number) => {
      const oilQty = this.deliveryData?.oilQuantity || 0;
      const calculatedPrice = (unitPrice || 0) * oilQty;
      const roundedPrice = Math.round((calculatedPrice + Number.EPSILON) * 1000) / 1000;
      this.mainForm.get('price')?.setValue(roundedPrice, {emitEvent: false});
    });
    this.mainForm.get('storageUnit')?.valueChanges.subscribe(() => {
      // storageUnit change logic if needed
    });
    let ruleKeysToWatch: string[];
    if (this.isOliveDelivery()) {
      ruleKeysToWatch = [this.findRuleKey('Infestees'), this.findRuleKey('Fermentees'), this.findRuleKey('Endommagees')];
    } else {
      ruleKeysToWatch = [this.findRuleKey('Acidite'), this.findRuleKey('K270'), this.findRuleKey('K232')];
    }
    ruleKeysToWatch.forEach((ruleKey) => {
      const control = this.mainForm.get(ruleKey);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.updateCategorie();
        });
      }
    });
  }

  getRuleType(ruleKey: string): 'NUMERIC' | 'BOOLEAN' | 'STRING' {
    return this.rules.find((r) => r.ruleKey === ruleKey)?.ruleType || 'NUMERIC';
  }

  onSave(): void {
    this.submitted = true;
    if (!this.mainForm.valid || this.isLoading ) {
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

    // Save static fields (unitPrice, price) first
    if (this.deliveryData) {
      this.deliveryData.unitPrice = this.mainForm.get('unitPrice')?.value;
      this.deliveryData.price = this.mainForm.get('price')?.value;
      // Find the selected storage unit object by ID
      const selectedStorageUnitId = this.mainForm.get('storageUnit')?.value;
      if (selectedStorageUnitId) {
        const selectedStorageUnit = this.storageUnits.find(unit => unit.id === selectedStorageUnitId);
        this.deliveryData.storageUnit = selectedStorageUnit || null;
      } else {
        this.deliveryData.storageUnit = null;
      }
      this.isLoading = true;
      this.deliveryService.updateDelivery(this.deliveryData).subscribe({
        next: (updatedDelivery) => {
          this.deliveryData = Array.isArray(updatedDelivery.data) ? updatedDelivery.data[0] : updatedDelivery.data;
          // Now save QC results
          this.saveQualityControlResults();
        },
        error: () => {
          this.snackBar.open('Erreur lors de l\'enregistrement des données financières.', 'Fermer', {
            duration: 4000,
            panelClass: ['mat-snack-bar-container-error']
          });
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveQualityControlResults(): void {
    // Handle dynamic fields
    const updates: QualityControlResultDto[] = [];
    const creates: QualityControlResultDto[] = [];
    Object.keys(this.dynamicForm.controls).forEach((ruleKey) => {
      const rule = this.rules.find((r) => r.ruleKey === ruleKey);
      if (!rule) return;
      const rawValue = this.mainForm.get(ruleKey)?.value;
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
      const existingResult = this.qualityControlResults.find((result) => result.rule?.ruleKey === ruleKey);
      const dto: QualityControlResultDto = {
        id: existingResult?.id,
        rule: rule,
        measuredValue: String(rawValue),
        deliveryId: this.deliveryData!.id
      };
      if (existingResult?.id) {
        updates.push(dto);
      } else {
        creates.push(dto);
      }
    });
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
        const allSuccessful = responses.every((res) => res.success);
        const anySuccessful = responses.some((res) => res.success);
        let message = '';
        if (allSuccessful) {
          if (updates.length > 0 && creates.length > 0) {
            message = 'Résultats mis à jour et créés avec succès.';
          } else if (updates.length > 0) {
            message = 'Résultats mis à jour avec succès.';
          } else if (creates.length > 0) {
            message = 'Résultats créés avec succès.';
          }
        } else if (anySuccessful) {
          message = 'Certains résultats ont été enregistrés, d\'autres ont échoué.';
        } else {
          message = 'Aucun résultat n\'a pu être enregistré.';
        }
        this.snackBar.open(message, 'Fermer', {
          duration: 4000,
          panelClass: allSuccessful ? ['mat-snack-bar-container-success'] : ['mat-snack-bar-container-warning']
        });
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadQualityControlResults();
        if (allSuccessful) {
          if (this.deliveryData?.deliveryType === 'OIL') {
            this.router.navigate(['reception/reception-huile']);
          } else if (this.deliveryData?.deliveryType === 'OLIVE') {
            this.router.navigate(['reception/reception-olive']);
          } else {
            this.router.navigate(['../'], { relativeTo: this.route });
          }
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement des résultats de contrôle qualité.', 'Fermer', {
          duration: 4000,
          panelClass: ['mat-snack-bar-container-error']
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onStorageUnitChange(event: MatSelectChange): void {
    const selectedStorageUnitId = event.value;

    // Find the selected storage unit object
    const selectedStorageUnit = this.storageUnits.find(unit => unit.id === selectedStorageUnitId);

    if (selectedStorageUnit) {
      console.log('Found selected storage unit object:', selectedStorageUnit);
      console.log('Storage unit name:', selectedStorageUnit.name);
      console.log('Storage unit current volume:', selectedStorageUnit.currentVolume);
      console.log('Storage unit max capacity:', selectedStorageUnit.maxCapacity);
      console.log('Storage unit status:', selectedStorageUnit.status);

      // Save the selected storage unit to deliveryData (local only, not saved yet)
      this.deliveryData!.storageUnit = selectedStorageUnit;

      console.log('Updated deliveryData.storageUnit (local):', this.deliveryData!.storageUnit);
      console.log('deliveryData.storageUnit.id:', this.deliveryData!.storageUnit?.id);
      console.log('deliveryData.storageUnit.name:', this.deliveryData!.storageUnit?.name);

      // Show success message (local selection only) with translation
      this.translate.get('CONTROLE_QUALITE.STORAGE_UNIT.MESSAGES.SELECTED', {name: selectedStorageUnit.name}).subscribe((message: string) => {
        this.snackBar.open(message, this.translate.instant('STANDARD.BTNS.CANCEL'), {
          duration: 3000,
          panelClass: ['mat-snack-bar-container-success']
        });
      });
    } else {
      console.error('Selected storage unit not found in storageUnits array');
      console.log('Available storage units:', this.storageUnits);
      this.translate.get('CONTROLE_QUALITE.STORAGE_UNIT.MESSAGES.SELECTION_ERROR').subscribe((message: string) => {
        this.snackBar.open(message, this.translate.instant('STANDARD.BTNS.CANCEL'), {
          duration: 3000,
          panelClass: ['mat-snack-bar-container-error']
        });
      });
    }
  }

  getRuleName(key: string): string {
    const r = this.rules.find((rule) => rule.ruleKey === key);
    return r ? r.ruleName! : key;
  }

  getTextOptions(ruleKey: string): string[] {
    const rule = this.rules.find((r) => r.ruleKey === ruleKey);
    if (!rule || !rule.ruleTextValue) return [];

    return rule.ruleTextValue
      .split(',')
      .map((val) => val.trim())
      .filter((val) => val.length > 0);
  }


  // getRuleMaxValue(ruleKey: string): number | null {
  //   const rule = this.rules.find((r) => r.ruleKey === ruleKey);
  //   return rule?.maxValue !== undefined ? rule.maxValue : null;
  // }

  // loadStorageUnits(): void {
  //   this.isLoading = true;
  //   this.storageUnitService.getAllStorageUnit().subscribe({
  //     next: (response) => {
  //       if (response.success) {
  //         this.storageUnits = response.data;
  //         console.log("unit sotarge", this.storageUnits)
  //       } else {
  //         this.snackBar.open(response.message || 'Error loading storage units', 'Close', {duration: 3000});
  //       }
  //       this.isLoading = false;
  //     },
  //     error: (error) => {
  //       console.error('Error loading storage units:', error);
  //       this.snackBar.open('Error loading storage units', 'Close', {duration: 3000});
  //       this.isLoading = false;
  //     }
  //   });
  // }

  private findRuleKey(displayedName: string): string {
    const normalized = displayedName.toLowerCase();
    const rule = this.rules.find((r) => r.ruleKey?.toLowerCase() === normalized);
    return rule ? rule.ruleKey : '';
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

  isOliveDelivery(): boolean {
    return this.deliveryData?.deliveryType === 'OLIVE';
  }

  isOilReception(): boolean {
    return this.deliveryData?.deliveryType === 'OIL';
  }

  isFormValid(): boolean {
    // Only rely on mainForm.valid, which covers visible fields
    return this.mainForm && this.mainForm.valid;
  }

  isStaticField(key: string): boolean {
    return key === 'unitPrice' || key === 'price' || key === 'storageUnit';
  }

  private calculateCategorie(): string {
    if (this.isOliveDelivery()) {
      return this.calculateCategorieOlive();
    } else {
      return this.calculateCategorieOil();
    }
  }

  private updateCategorie(): void {
    const calculated = this.calculateCategorie();
    const categorieControl = this.dynamicForm.get('Categorie');

    if (!categorieControl) {
      console.warn("Le champ 'Categorie' n'existe pas dans le formulaire.");
      return;
    }

    const currentCategorie = categorieControl.value;

    if (currentCategorie !== calculated) {
      console.log('Mise à jour automatique de la catégorie en :', calculated);
      categorieControl.setValue(calculated, {emitEvent: false});
      categorieControl.updateValueAndValidity();
    }
  }

  private calculateCategorieOil(): string {
    const acidite = this.dynamicForm.get('Acidite')?.value;
    const k270 = this.dynamicForm.get('K270')?.value;
    const k232 = this.dynamicForm.get('K232')?.value;

    console.log('Valeurs avant calcul (OIL):', {acidite, k270, k232});
    if (
      acidite == null ||
      typeof acidite !== 'number' ||
      k270 == null ||
      typeof k270 !== 'number' ||
      k232 == null ||
      typeof k232 !== 'number'
    ) {
      return '';
    }

    if (acidite < 0.8 && k270 < 0.22 && k232 < 2.5) {
      return 'Vierge Extra';
    } else if (acidite < 2 && k270 < 0.25 && k232 < 2.6) {
      return 'Vierge';
    } else {
      return 'Lampante';
    }
  }

  private calculateCategorieOlive(): string {
    const infestees = this.dynamicForm.get('Infestees')?.value;
    const fermentees = this.dynamicForm.get('Fermentees')?.value;
    const endommagees = this.dynamicForm.get('Endommagees')?.value;

    console.log('Valeurs avant calcul (OLIVE):', {infestees, fermentees, endommagees});

    if (
      infestees == null ||
      typeof infestees !== 'number' ||
      fermentees == null ||
      typeof fermentees !== 'number' ||
      endommagees == null ||
      typeof endommagees !== 'number'
    ) {
      return '';
    }

    const allLessThanOrEqual30 = infestees <= 30 && fermentees <= 30 && endommagees <= 30;
    const allLessThanOrEqual60 = infestees <= 60 && fermentees <= 60 && endommagees <= 60;

    if (allLessThanOrEqual30) {
      return 'Vierge Extra';
    } else if (allLessThanOrEqual60) {
      return 'Vierge';
    } else {
      return 'Lampante';
    }
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { QualityControlRuleService } from '../../shared/services/quality-control-rule.service';
import { QualityControlRule } from '../../shared/models/quality-control-rule';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnifiedDeliveryService } from '../../shared/services/delivery.service';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { QualityControlResultService } from '../../shared/services/quality-control-result.service';
import { QualityControlResultDto } from '../../shared/models/QualityControlResultDto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatOption, MatSelect, MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogData, ConfirmationDialogResult, ConfirmationType } from '../../shared/services/confirmation-dialog.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ToastService } from '../../shared/services/toast.service';
import { BaseTypeComponent } from '../../shared/modules/base-type/base-type.component';

@Component({
  selector: 'app-controlequalite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormField,
    MatSelect,
    MatOption,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    BaseTypeComponent
  ],
  templateUrl: './controleQualite.component.html',
  styleUrls: ['./controleQualite.component.scss'],
  standalone: true
})
export class ControleQualiteComponent implements OnInit {
  @Input() deliveryId: string | null = null;
  qualityForm!: FormGroup;
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
  deliveryForm: FormGroup;
  private xxx: string | null;
  private lastQualityPayload: any = null;
  private payload: any;

  /**
   * Constructor for the component
   * @param fb - FormBuilder instance for creating reactive forms
   * @param qcService - Service for quality control rules
   * @param qcResService - Service for quality control results
   * @param route - ActivatedRoute for accessing route parameters
   * @param deliveryService - Service for delivery operations
   * @param cdr - ChangeDetectorRef for manual change detection
   * @param toast - Service for displaying toast notifications
   * @param storageUnitService - Service for storage unit DTO operations
   * @param translate - Service for internationalization
   * @param router - Router for navigation
   * @param dialog - MatDialog for opening dialogs
   * @param dialogData - Optional data passed to the dialog, defaults to null
   */
  constructor(
    private fb: FormBuilder, // FormBuilder for reactive forms
    private qcService: QualityControlRuleService, // Service for quality control rules
    private qcResService: QualityControlResultService, // Service for quality control results
    private route: ActivatedRoute, // ActivatedRoute for accessing route parameters
    private deliveryService: UnifiedDeliveryService, // Service for delivery operations
    private cdr: ChangeDetectorRef, // ChangeDetectorRef for manual change detection
    private toast: ToastService, // Toast service for notifications
    private storageUnitService: StorageUnitDtoService, // Service for storage unit DTO operations
    private translate: TranslateService, // Translate service for i18n
    private router: Router, // Router for navigation
    private dialog: MatDialog, // MatDialog for opening dialogs
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: Record<string, unknown> | null = null // Optional dialog data with default null
  ) {
    if (dialogData && dialogData['deliveryId']) {
      this.deliveryId = dialogData['deliveryId'] as string; // Extract deliveryId from dialog data if present
    }
  }

  ngOnInit(): void {
    this.receptionId = this.deliveryId || this.route.snapshot.paramMap.get('id');
    this.xxx = this.route.snapshot.paramMap.get('idx');
    console.log(this.xxx);
    this.qualityForm = this.fb.group({
      oliveVariety: new FormControl(null)
    });
    if (this.xxx) {
      // If idx is present, fetch rules directly and skip delivery
      this.loadRulesDirect();
    } else {
      this.loadReception();
    }
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
        { value: initialValue, disabled: this.isQualityControlDone },
        rule.ruleType === 'STRING' && rule.ruleTextValue ? [] : validators
      );
    });
    this.dynamicForm = this.fb.group(group);
    this.mainForm = this.fb.group({ ...this.dynamicForm.controls });
    this.mainForm.get('unitPrice')?.valueChanges.subscribe((unitPrice: number) => {
      const oilQty = this.deliveryData?.oilQuantity || 0;
      const calculatedPrice = (unitPrice || 0) * oilQty;
      const roundedPrice = Math.round((calculatedPrice + Number.EPSILON) * 1000) / 1000;
      this.mainForm.get('price')?.setValue(roundedPrice, { emitEvent: false });
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

  async onSave(): Promise<void> {
    this.submitted = true;

    // Check if we have valid forms
    const isMainFormValid = this.mainForm && this.mainForm.valid;
    const isQualityFormValid = !this.isOliveDelivery() || (this.qualityForm && this.qualityForm.valid);

    if (!isMainFormValid || !isQualityFormValid || this.isLoading) {
      return;
    }
    // 1) build dialog parameters
    const dialogData: ConfirmationDialogData = {
      title: this.translate.instant('STANDARD.CONFIRMATION.SAVE_QC.TITLE'),
      message: this.translate.instant('STANDARD.CONFIRMATION.SAVE_QC.MESSAGE'),
      confirmText: this.translate.instant('STANDARD.CONFIRMATION.SAVE'),
      cancelText: this.translate.instant('STANDARD.CONFIRMATION.CANCEL'),
      type: ConfirmationType.WARNING,
      destructive: false,
      showIcon: true
    };

    // 2) open the confirmation dialog
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData
    });

    // 3) only if the user clicked “Save” do we run performSave()
    ref.afterClosed().subscribe((res: ConfirmationDialogResult) => {
      if (res?.confirmed) {
        this.performSave();
      }
    });
  }

  async performSave(): Promise<void> {
    this.submitted = true;

    // Check if we have valid forms
    const isMainFormValid = this.mainForm && this.mainForm.valid;
    const isQualityFormValid = !this.isOliveDelivery() || (this.qualityForm && this.qualityForm.valid);

    if (!isMainFormValid || !isQualityFormValid || this.isLoading) {
      return;
    }

    // If idx is present, send results to a new endpoint with idx as path param
    if (this.xxx) {
      const results: QualityControlResultDto[] = Object.keys(this.dynamicForm.controls)
        .map((ruleKey) => {
          const rule = this.rules.find((r) => r.ruleKey === ruleKey);
          if (!rule) return null;
          const rawValue = this.mainForm.get(ruleKey)?.value;
          return {
            rule: rule,
            measuredValue: String(rawValue),
            deliveryId: '' // Use empty string to satisfy type
          } as QualityControlResultDto;
        })
        .filter(Boolean) as QualityControlResultDto[];
      this.isLoading = true;
      this.qcResService.saveResultsWithIdx(this.xxx, results).subscribe({
        next: (res: any) => {
          this.toast.success(res.message || 'Résultats enregistrés avec succès.');
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.error("Erreur lors de l'enregistrement des résultats.");
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (!this.deliveryData?.id) {
      this.message = 'Données de livraison non disponibles.';
      this.cdr.detectChanges();
      this.toast.error('Données de livraison manquantes.');
      return;
    }

    // Handle olive variety update for olive deliveries
    if (this.isOliveDelivery() && this.qualityForm.get('oliveVariety')?.value) {
      // Update delivery with olive variety first, then save QC results
      this.updateDeliveryWithOliveVariety();
    } else {
      // Save other delivery data and QC results
      this.saveDeliveryAndQCResults();
    }
  }

  saveQualityControlResults(): void {
    // Handle dynamic fields (excluding oliveVariety which is handled separately)
    const updates: QualityControlResultDto[] = [];
    const creates: QualityControlResultDto[] = [];
    Object.keys(this.dynamicForm.controls).forEach((ruleKey) => {
      // Skip oliveVariety as it's handled separately
      if (ruleKey === 'oliveVariety') {
        return;
      }

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
            return of({ success: false, message: 'Erreur lors de la mise à jour des résultats.' });
          })
        )
      );
    }
    if (creates.length > 0) {
      requests.push(
        this.qcResService.createResults(creates).pipe(
          catchError((err) => {
            console.error('Erreur lors de la création:', err);
            return of({ success: false, message: 'Erreur lors de la création des résultats.' });
          })
        )
      );
    }
    if (requests.length === 0) {
      this.toast.warning('Aucun changement à enregistrer.');
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
          message = "Certains résultats ont été enregistrés, d'autres ont échoué.";
        } else {
          message = "Aucun résultat n'a pu être enregistré.";
        }
        this.toast.success(message);
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
        this.toast.error("Erreur lors de l'enregistrement des résultats de contrôle qualité.");
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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

  isOliveDelivery(): boolean {
    return this.deliveryData?.deliveryType === 'OLIVE';
  }

  isFormValid(): boolean {
    // Check main form validity
    const isMainFormValid = this.mainForm && this.mainForm.valid;

    // For olive deliveries, also check quality form
    if (this.isOliveDelivery()) {
      const isQualityFormValid = this.qualityForm && this.qualityForm.valid;
      return isMainFormValid && isQualityFormValid;
    }

    return isMainFormValid;
  }

  onOliveVarietySelected(value: any): void {
    this.qualityForm.get('oliveVariety')?.setValue(value);
    this.qualityForm.get('oliveVariety')?.markAsDirty();
    this.qualityForm.get('oliveVariety')?.markAsTouched();
  }

  /**
   * Updates the delivery with the selected olive variety
   */
  private updateDeliveryWithOliveVariety(): void {
    const oliveVariety = this.qualityForm.get('oliveVariety')?.value;

    // Create a complete payload with all delivery data including olive variety
    const updatedDelivery: Partial<UnifiedDelivery> = {
      id: this.deliveryData!.id,
      deliveryType: this.deliveryData!.deliveryType,
      deliveryNumber: this.deliveryData!.deliveryNumber,
      lotNumber: this.deliveryData!.lotNumber,
      deliveryDate: this.deliveryData!.deliveryDate,
      region: this.deliveryData!.region,
      poidsBrute: this.deliveryData!.poidsBrute,
      poidsNet: this.deliveryData!.poidsNet,
      matriculeCamion: this.deliveryData!.matriculeCamion,
      etatCamion: this.deliveryData!.etatCamion,
      supplier: this.deliveryData!.supplier,
      trtDate: this.deliveryData!.trtDate,
      oliveVariety: oliveVariety, // This is the key update
      sackCount: this.deliveryData!.sackCount,
      oliveType: this.deliveryData!.oliveType,
      oilType: this.deliveryData!.oilType,
      operationType: this.deliveryData!.operationType,
      parcel: this.deliveryData!.parcel,
      price: this.deliveryData!.price,
      globalLotNumber: this.deliveryData!.globalLotNumber,
      unitPrice: this.deliveryData!.unitPrice,
      paidAmount: this.deliveryData!.paidAmount,
      unpaidAmount: this.deliveryData!.unpaidAmount,
      rendement: this.deliveryData!.rendement,
      oliveQuantity: this.deliveryData!.oliveQuantity,
      storageUnit: this.deliveryData!.storageUnit,
      poidsCamionVide: this.deliveryData!.poidsCamionVide
    };

    this.isLoading = true;
    this.deliveryService.updateUnifiedDelivery(updatedDelivery as UnifiedDelivery).subscribe({
      next: (response) => {
        if (response.success) {
          this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
          this.toast.success("Variété d'olive mise à jour avec succès.");
          // Now save QC results
          this.saveQualityControlResults();
        } else {
          this.toast.error("Erreur lors de la mise à jour de la variété d'olive.");
          this.isLoading = false;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating delivery with olive variety:', error);
        this.toast.error("Erreur lors de la mise à jour de la variété d'olive.");
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Save delivery data (other than olive variety) and QC results
   */
  private saveDeliveryAndQCResults(): void {
    // Save static fields (unitPrice, price) first
    if (this.deliveryData) {
      this.deliveryData.unitPrice = this.mainForm.get('unitPrice')?.value;
      this.deliveryData.price = this.mainForm.get('price')?.value;
      // Find the selected storage unit object by ID
      const selectedStorageUnitId = this.mainForm.get('storageUnit')?.value;
      if (selectedStorageUnitId) {
        const selectedStorageUnit = this.storageUnits.find((unit) => unit.id === selectedStorageUnitId);
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
          this.toast.error("Erreur lors de l'enregistrement des données de livraison.");
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private findRuleKey(displayedName: string): string {
    const normalized = displayedName.toLowerCase();
    const rule = this.rules.find((r) => r.ruleKey?.toLowerCase() === normalized);
    return rule ? rule.ruleKey : '';
  }

  private filterRules(allRules: QualityControlRule[]): QualityControlRule[] {
    // If idx is present, always return oil QC rules
    if (this.xxx) {
      return allRules.filter((rule) => rule.oilQc === true);
    }
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
      categorieControl.setValue(calculated, { emitEvent: false });
      categorieControl.updateValueAndValidity();
    }
  }

  private calculateCategorieOil(): string {
    const acidite = this.dynamicForm.get('Acidite')?.value;
    const k270 = this.dynamicForm.get('K270')?.value;
    const k232 = this.dynamicForm.get('K232')?.value;

    console.log('Valeurs avant calcul (OIL):', { acidite, k270, k232 });
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
      return 'Extra Vierge';
    } else if (acidite < 2 && k270 < 0.25 && k232 < 2.6) {
      return 'Vierge';
    } else {
      return 'Lampante';
    }
  }

  // New method: fetch all rules and show form, skip delivery

  private calculateCategorieOlive(): string {
    const infestees = this.dynamicForm.get('Infestees')?.value;
    const fermentees = this.dynamicForm.get('Fermentees')?.value;
    const endommagees = this.dynamicForm.get('Endommagees')?.value;

    console.log('Valeurs avant calcul (OLIVE):', { infestees, fermentees, endommagees });

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
      return 'Extra Vierge';
    } else if (allLessThanOrEqual60) {
      return 'Vierge';
    } else {
      return 'Lampante';
    }
  }

  private loadRulesDirect(): void {
    this.isLoading = true;
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
          this.qualityControlResults = [];
          this.isQualityControlDone = false;
          this.createDynamicForm();
          this.isLoading = false;
          this.cdr.detectChanges();
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

  /**
   * Immediately updates the delivery with the selected olive variety
   */
  private updateDeliveryWithSelectedOliveVariety(oliveVariety: any): void {
    console.log('Updating delivery with olive variety:', oliveVariety);

    // Create updated delivery object
    const updatedDelivery = {
      ...this.deliveryData,
      oliveVariety: oliveVariety
    } as UnifiedDelivery;

    console.log('Updated delivery object:', updatedDelivery);

    // Update the delivery
    this.deliveryService.updateUnifiedDelivery(updatedDelivery).subscribe({
      next: (response) => {
        if (response.success) {
          this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
          console.log('Delivery updated with olive variety:', oliveVariety);
          this.toast.success("Variété d'olive mise à jour avec succès.");
        } else {
          console.error('Failed to update delivery with olive variety');
          this.toast.error("Erreur lors de la mise à jour de la variété d'olive.");
        }
      },
      error: (error) => {
        console.error('Error updating delivery with olive variety:', error);
        this.toast.error("Erreur lors de la mise à jour de la variété d'olive.");
      }
    });
  }
}

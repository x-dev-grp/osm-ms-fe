import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  LabelCategory,
  LabelClaimType,
  LabelContentDto,
  LabelContentUpdateRequestDto,
  LabelExportDto,
  LabelGenerateRequestDto,
  LabelLanguage,
  LabelQualityGrade,
  LabelValidationIssueDto
} from '../../models/label.model';

import { LabelService } from '../../services/label.service';
import { Product, productDisplayName } from '../../../stock/models/sku.model';
import { SKUService } from '../../../stock/services/sku.service';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';

import { BaseType } from '../../../shared/models/base-type';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { ProductionTraceabilityService } from '../../../shared/services/production-traceability.service';
import { ProductionGenealogy } from '../../../shared/models/production-genealogy.model';
import { TraceabilityPreviewComponent } from '../../../shared/components/traceability-preview/traceability-preview.component';

@Component({
  selector: 'app-label-workflow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    MatExpansionModule,
    TraceabilityPreviewComponent
  ],
  templateUrl: './label-workflow.component.html',
  styleUrls: ['./label-workflow.component.scss']
})
export class LabelWorkflowComponent implements OnInit {
  readonly languages: LabelLanguage[] = ['FR', 'EN', 'AR'];

  readonly claimTypeOptions: { value: LabelClaimType; label: string }[] = [
    { value: 'MADE_IN_TUNISIA', label: 'Produit de Tunisie' },
    { value: 'BIO', label: 'Agriculture Biologique' },
    { value: 'COLD_EXTRACTION', label: 'Extraction à froid' },
    { value: 'PRIVATE_LABEL', label: 'Marque Privée' },
    { value: 'OTHER', label: 'Autre' }
  ];

  readonly qualityGradeOptions: { value: LabelQualityGrade; label: string }[] = [
    { value: 'EXTRA_VIRGIN', label: 'Huile d’olive vierge extra' },
    { value: 'VIRGIN', label: 'Huile d’olive vierge' },
    { value: 'ORDINARY_VIRGIN', label: 'Huile d’olive vierge courante' },
    { value: 'LAMPANTE', label: 'Huile d’olive lampante' },
    { value: 'REFINED', label: 'Huile d’olive raffinée' },
    { value: 'OLIVE_OIL', label: 'Huile d’olive' },
    { value: 'POMACE_OIL', label: 'Huile de grignons d’olive' }
  ];

  readonly labelForm = this.fb.group({
    lotId: ['', Validators.required],
    packagingId: ['', Validators.required],
    packagingDate: [this.formatDateInput(new Date()), Validators.required],
    language: ['FR' as LabelLanguage, Validators.required],
    labelCategory: ['UNIT' as LabelCategory, Validators.required],

    qualityGrade: ['' as LabelQualityGrade | ''],
    variety: [''],

    legalDenomination: [''],
    certifications: [[] as string[]],
    claimTypes: [[] as LabelClaimType[]],
    storageConditions: [''],
    sensoryProfile: [''],
    lotNumber: [''],
    originCountry: [''],
    netQuantity: [''],
    responsibleName: [''],
    responsibleAddress: [''],
    extractionMethod: [''],
    bestBeforeDate: ['']
  });

  filtrationOperations: FiltrationOperation[] = [];
  packagingOptions: Product[] = [];
  availableCertifications: Certification[] = [];
  oilVarieties: BaseType[] = [];

  currentLabel: LabelContentDto | null = null;
  exportedLabel: LabelExportDto | null = null;

  loadingLookups = true;
  loadingLabel = false;
  generating = false;
  saving = false;
  drafting = false;
  finalizing = false;
  exporting = false;

  draftSavedRecently = false;
  finalizedRecently = false;
  private companyProfile: CompanyProfile | null = null;

  private draftSavedTimer: ReturnType<typeof setTimeout> | null = null;
  private finalizedTimer: ReturnType<typeof setTimeout> | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly labelService: LabelService,
    private readonly skuService: SKUService,
    private readonly certificationService: CertificationService,
    private readonly genericTypeService: GenericTypeService,
    private readonly filtrationService: FiltrationApiService,
    private readonly companyProfileService: CompanyProfileService,
    private readonly productionTraceabilityService: ProductionTraceabilityService
  ) { }

  ngOnInit(): void {
    this.loadCompanyProfileDefaults();
    this.loadLotsAndPackaging();
    this.saving = false;
    this.finalizing = false;
    this.exporting = false;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();
  }

  hasGeneratedLabel(): boolean {
    return !!this.currentLabel?.id;
  }

  isFinalized(): boolean {
    return this.currentLabel?.status === 'FINALIZED';
  }

  blockingIssues(): LabelValidationIssueDto[] {
    return (this.currentLabel?.validationIssues || []).filter((i) => i.blocking);
  }

  /** Returns list of required fields that are currently empty */
  missingRequiredFields(): { field: string; label: string }[] {
    const v = this.labelForm.value;
    const missing: { field: string; label: string }[] = [];

    if (!v.legalDenomination?.trim()) missing.push({ field: 'legalDenomination', label: 'Dénomination légale' });
    if (!v.lotNumber?.trim()) missing.push({ field: 'lotNumber', label: 'N° de Lot' });
    if (!v.netQuantity?.trim()) missing.push({ field: 'netQuantity', label: 'Quantité nette' });
    if (!v.packagingDate?.trim()) missing.push({ field: 'packagingDate', label: 'Date de conditionnement' });
    if (!v.bestBeforeDate?.trim()) missing.push({ field: 'bestBeforeDate', label: 'D.D.M.' });
    if (!v.originCountry?.trim()) missing.push({ field: 'originCountry', label: 'Pays d\'origine' });
    if (!v.qualityGrade) missing.push({ field: 'qualityGrade', label: 'Qualité' });
    if (!v.responsibleName?.trim()) missing.push({ field: 'responsibleName', label: 'Responsable' });
    if (!v.responsibleAddress?.trim()) missing.push({ field: 'responsibleAddress', label: 'Adresse du responsable' });

    return missing;
  }

  canFinalize(): boolean {
    return this.missingRequiredFields().length === 0 && this.blockingIssues().length === 0;
  }

  previewPayload(): string {
    if (this.exportedLabel?.payloadJson) {
      return this.exportedLabel.payloadJson;
    }

    if (this.currentLabel?.finalPayloadJson) {
      return this.currentLabel.finalPayloadJson;
    }

    return '';
  }

  pageBusy(): boolean {
    return this.loadingLookups || this.loadingLabel;
  }

  loadLotsAndPackaging(): void {
    this.loadingLookups = true;
    this.clearMessages();

    forkJoin({
      filtrationResponse: this.filtrationService.getAll(),
      packagingOptions: this.skuService.getActiveProductsByType('NON_VRAC'),
      availableCertifications: this.certificationService.getAll(),
      oilVarieties: this.genericTypeService.getAllTypes(TypeCategory.OLIVE_VARIETY) //type d'olive) exp
    }).subscribe({
      next: ({
        filtrationResponse,
        packagingOptions,
        availableCertifications,
        oilVarieties
      }) => {
        this.filtrationOperations = (filtrationResponse || [])
          .filter(op => op.status === 'COMPLETED')
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        this.packagingOptions = [...(packagingOptions ?? [])]
          .filter((sku) => sku?.id)
          .sort((left, right) => productDisplayName(left).localeCompare(productDisplayName(right)));

        this.availableCertifications = (availableCertifications || []).filter((c) => c.isActive);
        this.oilVarieties = oilVarieties?.data || [];

        this.loadingLookups = false;
        this.initFromRoute();
      },
      error: (error) => {
        this.loadingLookups = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Impossible de charger les donnees necessaires a la generation des etiquettes.'
        );
      }
    });
  }

  generateLabel(): void {
    if (this.labelForm.invalid) {
      this.labelForm.markAllAsTouched();
      return;
    }

    const formValue = this.labelForm.getRawValue();
    const selectedOp = this.resolveFiltrationOperation(formValue.lotId || '');
    const filteredStorageId = selectedOp?.target?.id;

    if (!selectedOp || !filteredStorageId) {
      this.errorMessage = 'Selectionnez une operation de filtration terminee avec une cuve filtree valide.';
      this.labelForm.get('lotId')?.enable();
      return;
    }

    const request: LabelGenerateRequestDto = {
      lotId: filteredStorageId,
      productId: formValue.packagingId ?? '',
      filtrationOperationId: selectedOp.operationId,
      packagingId: formValue.packagingId ?? '',
      packagingDate: formValue.packagingDate ?? undefined,
      language: formValue.language ?? 'FR',
      labelCategory: formValue.labelCategory ?? 'UNIT',
      qualityGrade: formValue.qualityGrade || undefined,
      variety: formValue.variety?.trim() || undefined
    };

    this.generating = true;
    this.clearMessages();
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.generate(request).subscribe({
      next: (label) => {
        this.generating = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Le brouillon a été généré avec succès.';
      },
      error: (error) => {
        this.generating = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de la generation de l etiquette.'
        );
      }
    });
  }

  // Client-side auto-fill when lot is selected
  onLotChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedOp = this.resolveFiltrationOperation(select.value);
    if (!selectedOp) return;

    this.labelForm.get('lotId')?.setValue(selectedOp.operationId);
    // Pre-fill lot number from the filtration operation
    const lotNumber = selectedOp.targetLotNumber || selectedOp.target?.lotNumber || '';
    if (lotNumber && !this.labelForm.value.lotNumber) {
      this.labelForm.patchValue({ lotNumber });
    }

    // Pre-fill origin country (Tunisia by default for olive oil operations)
    if (!this.labelForm.value.originCountry) {
      this.labelForm.patchValue({ originCountry: 'Tunisie' });
    }

    // Pre-fill legal denomination if available from operation
    if (!this.labelForm.value.legalDenomination) {
      const grade = this.labelForm.value.qualityGrade;
      if (grade) {
        const gradeLabel = this.qualityGradeOptions.find(o => o.value === grade)?.label;
        if (gradeLabel) {
          this.labelForm.patchValue({ legalDenomination: gradeLabel });
        }
      }
    }

    this.prefillSensoryProfileFromFiltrationQc(selectedOp);
  }

  // Client-side auto-fill when packaging is selected
  onPackagingChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedProduct = this.packagingOptions.find(p => p.id === select.value);
    if (!selectedProduct) return;

    // Pre-fill net quantity from the packaging volume
    if (selectedProduct.volume && !this.labelForm.value.netQuantity) {
      this.labelForm.patchValue({ netQuantity: `${selectedProduct.volume} ml` });
    }
  }

  //enregi en format brouillon
  saveDraftChanges(): void {
    if (!this.currentLabel?.id || this.isFinalized()) {
      return;
    }

    this.saving = true;
    this.clearMessages();
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.update(this.currentLabel.id, this.buildUpdateRequest()).subscribe({
      next: (label) => {
        this.saving = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Le brouillon a été mis à jour.';
        this.showDraftSavedIndicator();
      },
      error: (error) => {
        this.saving = false;
        this.resetDraftSavedIndicator();
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de la mise à jour du brouillon.'
        );
      }
    });
  }

  markAsDraft(): void {
    if (!this.currentLabel?.id) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir déverrouiller cette étiquette ? Elle repassera en mode brouillon.')) {
      return;
    }

    this.drafting = true;
    this.clearMessages();
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.markAsDraft(this.currentLabel.id).subscribe({
      next: (label) => {
        this.drafting = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'L\'étiquette a été remise en brouillon.';
      },
      error: (error) => {
        this.drafting = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors du retour au statut brouillon.'
        );
      }
    });
  }

  finalizeLabel(): void {
    if (!this.currentLabel?.id || this.blockingIssues().length > 0) {
      return;
    }

    this.finalizing = true;
    this.clearMessages();
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.saveChanges()
      .pipe(switchMap(() => this.labelService.finalize(this.currentLabel!.id!)))
      .subscribe({
        next: (label) => {
          this.finalizing = false;
          this.syncFormWithLabel(label);
          this.successMessage = 'Le contenu etiquette a ete finalise et fige.';
          this.showFinalizedIndicator();
        },
        error: (error) => {
          this.finalizing = false;
          this.resetFinalizedIndicator();
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Erreur lors de la finalisation de l etiquette.'
          );
        }
      });
  }

  exportLabel(): void {
    if (!this.currentLabel?.id) {
      return;
    }

    this.exporting = true;
    this.clearMessages();

    this.labelService.export(this.currentLabel.id).subscribe({
      next: (labelExport) => {
        this.exporting = false;
        this.exportedLabel = labelExport;
        this.downloadJson(labelExport);
        this.successMessage = 'Le JSON etiquette a ete exporte.';
      },
      error: (error) => {
        this.exporting = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de l export de l etiquette.'
        );
      }
    });
  }

  clearAndRestart(): void {
    this.currentLabel = null;
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelForm.reset({
      lotId: '',
      packagingId: '',
      packagingDate: this.formatDateInput(new Date()),
      language: 'FR',
      labelCategory: 'UNIT',
      qualityGrade: '',
      variety: '',
      legalDenomination: '',
      certifications: [],
      claimTypes: [],
      storageConditions: '',
      sensoryProfile: '',
      lotNumber: '',
      originCountry: '',
      netQuantity: '',
      responsibleName: '',
      responsibleAddress: '',
      extractionMethod: '',
      bestBeforeDate: ''
    });
    this.applyCompanyDefaultsToForm();

    this.clearMessages();
    this.router.navigate(['/labels']);
  }

  selectedLotLabel(): string {
    const selectedOp = this.selectedFiltrationOperation();
    return selectedOp ? this.filtrationOperationLabel(selectedOp) : '-';
  }

  selectedFiltrationOperation(): FiltrationOperation | undefined {
    return this.resolveFiltrationOperation(this.labelForm.getRawValue().lotId || '');
  }

  traceabilityAnchorId(): string | null {
    const selectedOp = this.selectedFiltrationOperation();
    return selectedOp?.target?.id || selectedOp?.source?.id || null;
  }

  selectedSourceStorageLabel(): string {
    const source = this.selectedFiltrationOperation()?.source;
    return source ? this.storageUnitLabel(source) : '-';
  }

  selectedFilteredStorageLabel(): string {
    const target = this.selectedFiltrationOperation()?.target;
    return target ? this.storageUnitLabel(target) : '-';
  }

  selectedPackagingLabel(): string {
    const selectedPackaging = this.packagingOptions.find(
      (sku) => sku.id === this.labelForm.value.packagingId
    );

    return selectedPackaging ? this.productLabel(selectedPackaging) : '-';
  }

  get selectedCertifications(): Certification[] {
    const selectedNames = this.labelForm.get('certifications')?.value || [];
    return this.availableCertifications.filter((c) => selectedNames.includes(c.name));
  }

  resolveClaimLabel(claimValue: string): string {
    return this.claimTypeOptions.find((o) => o.value === claimValue)?.label ?? claimValue;
  }

  resolveQualityLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return this.qualityGradeOptions.find((option) => option.value === value)?.label ?? value;
  }

  resolveVarietyLabel(value: string | null | undefined): string {
    return this.resolveBaseTypeLabel(value, this.oilVarieties);
  }

  baseTypeLabel(type: BaseType): string {
    const item = type as unknown as {
      id?: string;
      name?: string;
      label?: string;
      value?: string;
      code?: string;
      libelle?: string;
      designation?: string;
    };

    return (
      item.name ||
      item.label ||
      item.libelle ||
      item.designation ||
      item.value ||
      item.code ||
      String(item.id || '')
    );
  }

  baseTypeValue(type: BaseType): string {
    const item = type as unknown as {
      id?: string;
      code?: string;
      value?: string;
      name?: string;
    };

    return item.code || item.value || item.name || String(item.id || '');
  }

  filtrationOperationLabel(op: FiltrationOperation): string {
    const lot = op.targetLotNumber || op.target?.lotNumber || 'LOT INCONNU';
    const volume = op.volumeAfter ? ` | ${op.volumeAfter}L` : '';
    const date = op.timestamp ? ` (${new Date(op.timestamp).toLocaleDateString()})` : '';
    return `${lot}${volume}${date}`;
  }

  storageUnitLabel(storageUnit: { id?: string; name?: string; lotNumber?: string; currentVolume?: number | null }): string {
    const name = storageUnit.name || 'Cuve inconnue';
    const lot = storageUnit.lotNumber ? ` | Lot ${storageUnit.lotNumber}` : '';
    const volume = storageUnit.currentVolume != null ? ` | ${storageUnit.currentVolume}L` : '';
    return `${name}${lot}${volume}`;
  }

  productLabel(product: Product): string {
    const volume = product.volume ? `${product.volume} ml` : 'volume inconnu';
    const packaging = product.packagingType ? ` | ${product.packagingType}` : '';
    return `${productDisplayName(product)} | ${volume}${packaging}`;
  }

  trackById(index: number, item: unknown): string {
    const typedItem = item as { id?: string; operationId?: string };
    return typedItem?.id ?? typedItem?.operationId ?? `${index}`;
  }

  private saveChanges(): Observable<LabelContentDto> {
    if (!this.currentLabel?.id || this.isFinalized() || !this.labelForm.dirty) {
      return of(this.currentLabel as LabelContentDto);
    }

    return this.labelService.update(this.currentLabel.id, this.buildUpdateRequest());
  }

  private buildUpdateRequest(): LabelContentUpdateRequestDto {
    return {
      language: (this.labelForm.value.language as LabelLanguage | null) ?? undefined,
      packagingDate: this.labelForm.value.packagingDate ?? undefined,

      qualityGrade: this.labelForm.value.qualityGrade || undefined,
      variety: this.labelForm.value.variety?.trim() || undefined,

      legalDenomination: this.labelForm.value.legalDenomination?.trim() || undefined,
      storageConditions: this.labelForm.value.storageConditions?.trim() || undefined,
      sensoryProfile: this.labelForm.value.sensoryProfile?.trim() || undefined,
      certifications: this.normalizeArray(this.labelForm.value.certifications),
      claimTypes: this.normalizeArray(this.labelForm.value.claimTypes),
      lotNumber: this.labelForm.value.lotNumber?.trim() || undefined,
      originCountry: this.labelForm.value.originCountry?.trim() || undefined,
      netQuantity: this.labelForm.value.netQuantity?.trim() || undefined,
      responsibleName: this.labelForm.value.responsibleName?.trim() || undefined,
      responsibleAddress: this.labelForm.value.responsibleAddress?.trim() || undefined,
      extractionMethod: this.labelForm.value.extractionMethod?.trim() || undefined,
      bestBeforeDate: this.labelForm.value.bestBeforeDate?.trim() || undefined
    };
  }

  private initFromRoute(): void {
    const labelId = this.route.snapshot.paramMap.get('id');

    if (labelId) {
      this.fetchLabelId(labelId);
      return;
    }

    this.fromUrl();
  }

  private fromUrl(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const requestedLotOrOperationId = queryParams.get('filtrationOperationId') ?? queryParams.get('lotId');
    const selectedOp =
      this.resolveFiltrationOperation(requestedLotOrOperationId) ||
      this.filtrationOperations[0];

    if (selectedOp) {
      this.labelForm.get('lotId')?.setValue(selectedOp.operationId);
      this.prefillFromFiltration(selectedOp);
      this.prefillSensoryProfileFromFiltrationQc(selectedOp);
    }

    this.labelForm.patchValue({
      packagingId: queryParams.get('packagingId') ?? this.labelForm.value.packagingId ?? '',
      packagingDate:
        queryParams.get('packagingDate') ??
        this.labelForm.value.packagingDate ??
        this.formatDateInput(new Date()),
      language: ((queryParams.get('language') as LabelLanguage | null) ??
        this.labelForm.value.language ??
        'FR') as LabelLanguage
    });
  }

  private fetchLabelId(labelId: string): void {
    this.loadingLabel = true;
    this.clearMessages();

    this.labelService.getById(labelId).subscribe({
      next: (label) => {
        this.loadingLabel = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Etiquette chargee avec succes.';
      },
      error: (error) => {
        this.loadingLabel = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Impossible de charger cette etiquette.'
        );
      }
    });
  }

  private syncFormWithLabel(label: LabelContentDto): void {
    this.currentLabel = label;
    const selectedOp = this.resolveFiltrationOperation(label.filtrationOperationId || label.lotId || '');

    this.labelForm.patchValue({
      lotId: selectedOp?.operationId || label.filtrationOperationId || label.lotId || '',
      packagingId: label.packagingId || '',
      packagingDate: label.packagingDate || this.formatDateInput(new Date()),
      language: label.language || 'FR',
      labelCategory: label.labelCategory || 'UNIT',

      qualityGrade: (label.qualityGrade as LabelQualityGrade) || '',
      variety: label.variety || '',

      legalDenomination: label.legalDenomination || '',
      storageConditions: label.storageConditions || '',
      sensoryProfile: label.sensoryProfile || '',
      certifications: label.certifications || [],
      claimTypes: label.claimTypes || [],
      lotNumber: label.lotNumber || '',
      originCountry: label.originCountry || '',
      netQuantity: label.netQuantity || '',
      responsibleName: label.responsibleName || '',
      responsibleAddress: label.responsibleAddress || '',
      extractionMethod: label.extractionMethod || '',
      bestBeforeDate: label.bestBeforeDate || ''
    });
    this.applyCompanyDefaultsToForm();

    this.labelForm.markAsPristine();
    if (selectedOp) {
      this.prefillSensoryProfileFromFiltrationQc(selectedOp);
    }

    if (label.id && this.route.snapshot.paramMap.get('id') !== label.id) {
      this.router.navigate(['/labels', label.id], { replaceUrl: true });
    }
  }

  private resolveFiltrationOperation(id: string | null | undefined): FiltrationOperation | undefined {
    if (!id) {
      return undefined;
    }

    return this.filtrationOperations.find((op) =>
      op.operationId === id ||
      op.target?.id === id ||
      op.source?.id === id ||
      op.targetLotNumber === id ||
      op.target?.lotNumber === id
    );
  }

  private prefillFromFiltration(selectedOp: FiltrationOperation): void {
    const lotNumber = selectedOp.targetLotNumber || selectedOp.target?.lotNumber || '';
    if (lotNumber && !this.labelForm.value.lotNumber) {
      this.labelForm.patchValue({ lotNumber });
    }

    if (!this.labelForm.value.originCountry) {
      this.labelForm.patchValue({ originCountry: 'Tunisie' });
    }
  }

  private prefillSensoryProfileFromFiltrationQc(selectedOp: FiltrationOperation): void {
    const sensoryProfile = (this.labelForm.getRawValue().sensoryProfile || '').trim();
    if (sensoryProfile) {
      return;
    }

    const genealogyAnchor = selectedOp.target?.id || selectedOp.source?.id;
    if (!genealogyAnchor) {
      return;
    }

    this.productionTraceabilityService.getGenealogy(genealogyAnchor).subscribe({
      next: (genealogy) => {
        const controls = this.resolvePostFiltrationQualityControls(genealogy);
        const formatted = this.formatQualityControlsForSensoryProfile(controls);

        if (!formatted) {
          return;
        }

        const currentProfile = (this.labelForm.getRawValue().sensoryProfile || '').trim();
        if (!currentProfile) {
          this.labelForm.patchValue({ sensoryProfile: formatted });
        }
      }
    });
  }

  private resolvePostFiltrationQualityControls(genealogy: ProductionGenealogy | null | undefined): Record<string, string> | null {
    const direct = genealogy?.filteredQualityControls;
    if (direct && Object.keys(direct).length > 0) {
      return direct;
    }

    const fromSteps = genealogy?.filtrations
      ?.map((step) => step.qualityControls)
      .find((controls): controls is Record<string, string> => !!controls && Object.keys(controls).length > 0);

    return fromSteps || null;
  }

  private formatQualityControlsForSensoryProfile(controls: Record<string, string> | null): string {
    if (!controls) {
      return '';
    }

    return Object.entries(controls)
      .filter(([key, value]) => !!String(key || '').trim() && !!String(value || '').trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }

  private loadCompanyProfileDefaults(): void {
    const cachedProfile = this.companyProfileService.getProfileFromCache();
    if (cachedProfile) {
      this.companyProfile = cachedProfile;
      this.applyCompanyDefaultsToForm();
    }

    this.companyProfileService.getProfile().subscribe({
      next: (profile) => {
        this.companyProfile = profile;
        this.applyCompanyDefaultsToForm();
      }
    });
  }

  private applyCompanyDefaultsToForm(): void {
    if (!this.companyProfile) {
      return;
    }

    const currentValues = this.labelForm.getRawValue();
    const defaultAddress = this.buildCompanyAddress(this.companyProfile);

    const patch: Partial<typeof currentValues> = {};

    if (!currentValues.responsibleName?.trim() && this.companyProfile.legalName?.trim()) {
      patch.responsibleName = this.companyProfile.legalName.trim();
    }

    if (!currentValues.responsibleAddress?.trim() && defaultAddress) {
      patch.responsibleAddress = defaultAddress;
    }

    if (Object.keys(patch).length > 0) {
      this.labelForm.patchValue(patch);
    }
  }

  private buildCompanyAddress(profile: CompanyProfile): string {
    return [
      profile.addressLine1?.trim(),
      profile.postalCode?.trim(),
      profile.city?.trim(),
      profile.governorate?.trim()
    ]
      .filter((part) => !!part)
      .join(', ');
  }

  private resolveBaseTypeLabel(value: string | null | undefined, source: BaseType[]): string {
    if (!value) {
      return '-';
    }

    const found = source.find((item) => {
      const typedItem = item as unknown as {
        id?: string;
        code?: string;
        name?: string;
        label?: string;
        value?: string;
        libelle?: string;
        designation?: string;
      };

      return (
        String(typedItem.id) === value ||
        typedItem.code === value ||
        typedItem.name === value ||
        typedItem.label === value ||
        typedItem.value === value ||
        typedItem.libelle === value ||
        typedItem.designation === value
      );
    });

    return found ? this.baseTypeLabel(found) : value;
  }

  private showDraftSavedIndicator(): void {
    this.draftSavedRecently = true;

    if (this.draftSavedTimer) {
      clearTimeout(this.draftSavedTimer);
    }

    this.draftSavedTimer = setTimeout(() => {
      this.draftSavedRecently = false;
      this.draftSavedTimer = null;
    }, 3000);
  }

  private resetDraftSavedIndicator(): void {
    this.draftSavedRecently = false;

    if (this.draftSavedTimer) {
      clearTimeout(this.draftSavedTimer);
      this.draftSavedTimer = null;
    }
  }

  private showFinalizedIndicator(): void {
    this.finalizedRecently = true;

    if (this.finalizedTimer) {
      clearTimeout(this.finalizedTimer);
    }

    this.finalizedTimer = setTimeout(() => {
      this.finalizedRecently = false;
      this.finalizedTimer = null;
    }, 3000);
  }

  private resetFinalizedIndicator(): void {
    this.finalizedRecently = false;

    if (this.finalizedTimer) {
      clearTimeout(this.finalizedTimer);
      this.finalizedTimer = null;
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private downloadJson(labelExport: LabelExportDto): void {
    const fileName = `label-${labelExport.lotNumber || labelExport.labelId}.json`;
    const blob = new Blob([labelExport.payloadJson], {
      type: 'application/json;charset=utf-8'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(url);
  }

  private normalizeArray<T>(value: unknown): T[] {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s) as unknown as T[];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item) => (Array.isArray(item) ? item : [item])) as T[];
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    const genericMessage = (error as { message?: string })?.message;

    return apiMessage || genericMessage || fallback;
  }

  private formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

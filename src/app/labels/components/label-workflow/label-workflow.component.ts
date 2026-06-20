import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
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
  LabelValidationIssueDto
} from '../../models/label.model';
import { QualityGrades, resolveQualityGradeLabel } from '../../../shared/models/quality-grades.enum';

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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { ProductionTraceabilityService } from '../../../shared/services/production-traceability.service';
import { ProductionGenealogy } from '../../../shared/models/production-genealogy.model';
import {
  TraceabilityPreviewComponent
} from '../../../shared/components/traceability-preview/traceability-preview.component';
import {
  LabelPreviewCarouselComponent,
  LabelPreviewCarouselSlide
} from '../label-preview-carousel/label-preview-carousel.component';
import {
  LabelPreviewDialogComponent,
  LabelPreviewDialogData
} from '../label-preview-dialog/label-preview-dialog.component';
import { LabelPreviewViewModel } from '../../models/label-preview.model';
import {
  buildLabelEtiquettePayload,
  buildLabelPreviewViewModel,
  formatLabelPayloadJson
} from '../../utils/label-preview-payload.util';
import {
  buildIngredientDeclaration,
  buildNutritionDeclarationJson,
  buildProductName,
  extractCompositionOverrides,
  mergeValidationIssues,
  showEvooLegalStatement,
  TUNISIA_LABEL_DEFAULTS,
  validateLabelComplianceForm
} from '../../utils/label-compliance.util';
import {
  applyCompositionOverrides,
  buildLabelQcCompositionBundle,
  compositionSourceLabel,
  resolvePostFiltrationQualityControls as resolveQcControls
} from '../../utils/label-qc-composition.util';
import { LabelCompositionEntry } from '../../models/label-qc-composition.model';
import { PREVIEW_CAROUSEL_LANGUAGES, previewLanguageLabel } from '../../utils/label-preview-localization.util';
import { EanBarcodeComponent } from '../ean-barcode/ean-barcode.component';

@Component({
  selector: 'app-label-workflow',
  standalone: true,
  imports: [
    TranslateModule,
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
    MatDialogModule,
    TraceabilityPreviewComponent,
    LabelPreviewCarouselComponent,
    EanBarcodeComponent
  ],
  templateUrl: './label-workflow.component.html',
  styleUrls: ['./label-workflow.component.scss']
})
export class LabelWorkflowComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  readonly languages: LabelLanguage[] = ['FR', 'EN', 'AR'];

  readonly claimTypeOptions: { value: LabelClaimType; label: string }[] = [
    { value: 'MADE_IN_TUNISIA', label: 'Produit de Tunisie' },
    { value: 'BIO', label: 'Agriculture Biologique' },
    { value: 'COLD_EXTRACTION', label: 'Extraction à froid' },
    { value: 'PRIVATE_LABEL', label: 'Marque Privée' },
    { value: 'OTHER', label: 'Autre' }
  ];

  readonly grades = [QualityGrades.EXTRA_VIRGIN, QualityGrades.VIRGIN, QualityGrades.REFINED, QualityGrades.POMACE];

  readonly evooLegalStatement = TUNISIA_LABEL_DEFAULTS.evooStatement;

  readonly labelForm = this.fb.group({
    lotId: ['', Validators.required],
    packagingId: ['', Validators.required],
    packagingDate: [this.formatDateInput(new Date()), Validators.required],
    language: ['FR' as LabelLanguage, Validators.required],
    labelCategory: ['UNIT' as LabelCategory, Validators.required],

    qualityGrade: ['' as QualityGrades | ''],
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
    bestBeforeDate: [''],
    ingredientDeclaration: [''],
    ean13: [''],
    harvestYear: [''],
    acidityLevel: [''],
    brandName: ['']
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
  currentGenealogy: ProductionGenealogy | null = null;
  postFiltrationQualityControls: Record<string, string> | null = null;
  compositionOverrides: Record<string, string> = {};

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
    private readonly productionTraceabilityService: ProductionTraceabilityService,
    private readonly dialog: MatDialog
  ) {}

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

  statusLabel(status: string | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'FINALIZED':
        return 'Finalisée';
      case 'VALIDATED':
        return 'Validée';
      case 'EXPORTED_JSON':
        return 'Exportée JSON';
      default:
        return status || '-';
    }
  }

  blockingIssues(): LabelValidationIssueDto[] {
    return (this.currentLabel?.validationIssues || []).filter((i) => i.blocking);
  }

  /** Returns list of required fields that are currently empty (Tunisia compliance). */
  missingRequiredFields(): { field: string; label: string }[] {
    const v = this.labelForm.value;
    return mergeValidationIssues(
      validateLabelComplianceForm({
        legalDenomination: v.legalDenomination,
        qualityGrade: v.qualityGrade,
        originCountry: v.originCountry,
        netQuantity: v.netQuantity,
        responsibleName: v.responsibleName,
        responsibleAddress: v.responsibleAddress,
        lotNumber: v.lotNumber,
        bestBeforeDate: v.bestBeforeDate,
        storageConditions: v.storageConditions,
        ingredientDeclaration: v.ingredientDeclaration,
        nutritionDeclarationJson: this.buildNutritionDeclarationPayload(),
        ean13: v.ean13
      }),
      this.currentLabel?.validationIssues
    );
  }

  isEvooCategory(): boolean {
    return showEvooLegalStatement(this.labelForm.value.qualityGrade);
  }

  onQualityGradeChange(): void {
    const grade = this.labelForm.value.qualityGrade;
    if (!grade) {
      return;
    }
    this.labelForm.patchValue({
      legalDenomination: buildProductName(grade) || this.labelForm.value.legalDenomination,
      ingredientDeclaration: buildIngredientDeclaration(grade)
    });
  }

  compositionEntries(): LabelCompositionEntry[] {
    return this.buildCompositionBundle().compositionEstimate;
  }

  compositionSourceLabel(source: LabelCompositionEntry['source']): string {
    return compositionSourceLabel(source);
  }

  compositionPer100Value(entry: LabelCompositionEntry): string {
    return entry.per100ml || entry.value;
  }

  onCompositionOverride(key: string, value: string): void {
    const trimmed = value.trim();
    if (trimmed) {
      this.compositionOverrides = { ...this.compositionOverrides, [key]: trimmed };
    } else {
      const { [key]: _removed, ...rest } = this.compositionOverrides;
      this.compositionOverrides = rest;
    }
    this.labelForm.markAsDirty();
  }

  private buildCompositionBundle() {
    const form = this.labelForm.getRawValue();
    const packaging = this.packagingOptions.find((product) => product.id === form.packagingId);
    const controls = resolveQcControls(this.currentGenealogy, this.currentLabel, this.postFiltrationQualityControls);
    const language = form.language || this.currentLabel?.language || 'FR';
    const baseBundle = buildLabelQcCompositionBundle(controls, form.netQuantity, packaging?.density ?? null, language);

    return applyCompositionOverrides(baseBundle, this.compositionOverrides, form.netQuantity, language);
  }

  private buildNutritionDeclarationPayload(): string {
    return buildNutritionDeclarationJson(this.compositionEntries());
  }

  private loadCompositionOverridesFromLabel(label?: LabelContentDto | null): void {
    this.compositionOverrides = extractCompositionOverrides(label?.nutritionDeclarationJson);
  }

  canFinalize(): boolean {
    return this.missingRequiredFields().length === 0 && this.blockingIssues().length === 0;
  }

  readonly mandatoryChecklist: { field: string; label: string }[] = [
    { field: 'legalDenomination', label: 'Nom du produit' },
    { field: 'qualityGrade', label: 'Catégorie' },
    { field: 'originCountry', label: 'Origine' },
    { field: 'netQuantity', label: 'Quantité nette' },
    { field: 'responsibleName', label: 'Producteur' },
    { field: 'responsibleAddress', label: 'Adresse' },
    { field: 'lotNumber', label: 'N° de lot' },
    { field: 'bestBeforeDate', label: 'D.D.M.' },
    { field: 'storageConditions', label: 'Stockage' },
    { field: 'ingredientDeclaration', label: 'Ingrédients' }
  ];

  isChecklistItemMissing(field: string): boolean {
    return this.missingRequiredFields().some((item) => item.field === field);
  }

  complianceReadyCount(): number {
    return this.mandatoryChecklist.filter((item) => !this.isChecklistItemMissing(item.field)).length;
  }

  compliancePercent(): number {
    return Math.round((this.complianceReadyCount() / this.mandatoryChecklist.length) * 100);
  }

  pageTitle(): string {
    return this.currentLabel ? "Modifier l'étiquette" : 'Nouvelle étiquette';
  }

  previewPayload(): string {
    if (this.exportedLabel?.payloadJson) {
      return formatLabelPayloadJson(this.exportedLabel.payloadJson);
    }

    if (this.currentLabel?.finalPayloadJson) {
      return formatLabelPayloadJson(this.currentLabel.finalPayloadJson);
    }

    return formatLabelPayloadJson(buildLabelEtiquettePayload(this.buildPreviewPayloadOptions()));
  }

  previewViewModel(): LabelPreviewViewModel {
    return buildLabelPreviewViewModel(this.buildPreviewPayloadOptions());
  }

  previewCarouselSlides(): LabelPreviewCarouselSlide[] {
    const baseOptions = this.buildPreviewPayloadOptions();

    return PREVIEW_CAROUSEL_LANGUAGES.map((language) => ({
      language,
      label: previewLanguageLabel(language),
      preview: buildLabelPreviewViewModel({
        ...baseOptions,
        previewLanguage: language
      })
    }));
  }

  openPreviewDialog(slide?: LabelPreviewCarouselSlide): void {
    const data: LabelPreviewDialogData = {
      slides: this.previewCarouselSlides(),
      payloadJson: this.previewPayload(),
      initialLanguage: slide?.language
    };

    this.dialog.open(LabelPreviewDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      maxHeight: '95vh',
      panelClass: 'label-preview-dialog-panel',
      data
    });
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
      next: ({ filtrationResponse, packagingOptions, availableCertifications, oilVarieties }) => {
        this.filtrationOperations = (filtrationResponse || [])
          .filter((op) => op.status === 'COMPLETED')
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
          this.i18n.instant('AUTO.IMPOSSIBLE_DE_CHARGER_LES_DONNEES_NECESSAIRES_A_LA_GENERATION_DE')
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
      this.errorMessage = this.i18n.instant('AUTO.SELECTIONNEZ_UNE_OPERATION_DE_FILTRATION_TERMINEE_AVEC_UNE_CUVE_');
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
        this.successMessage = this.i18n.instant('AUTO.LE_BROUILLON_A_ETE_GENERE_AVEC_SUCCES');
      },
      error: (error) => {
        this.generating = false;
        this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_GENERATION_DE_L_ETIQUETTE'));
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
        const gradeLabel = this.resolveQualityLabel(grade);
        if (gradeLabel !== '-') {
          this.labelForm.patchValue({ legalDenomination: gradeLabel });
        }
      }
    }

    this.prefillSensoryProfileFromFiltrationQc(selectedOp);
  }

  // Client-side auto-fill when packaging is selected
  onPackagingChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedProduct = this.packagingOptions.find((p) => p.id === select.value);
    if (!selectedProduct) return;

    // Pre-fill net quantity from the packaging volume
    if (selectedProduct.volume && !this.labelForm.value.netQuantity) {
      this.labelForm.patchValue({ netQuantity: `${selectedProduct.volume} ml` });
    }

    if (selectedProduct.grade && !this.labelForm.value.qualityGrade) {
      this.labelForm.patchValue({ qualityGrade: selectedProduct.grade as QualityGrades });
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
        this.successMessage = this.i18n.instant('AUTO.LE_BROUILLON_A_ETE_MIS_A_JOUR');
        this.showDraftSavedIndicator();
      },
      error: (error) => {
        this.saving = false;
        this.resetDraftSavedIndicator();
        this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_MISE_A_JOUR_DU_BROUILLON'));
      }
    });
  }

  markAsDraft(): void {
    if (!this.currentLabel?.id) {
      return;
    }

    if (!confirm(this.i18n.instant('AUTO.ETES_VOUS_SUR_DE_VOULOIR_DEVERROUILLER_CETTE_ETIQUETTE_ELLE_REPA'))) {
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
        this.successMessage = this.i18n.instant('AUTO.L_ETIQUETTE_A_ETE_REMISE_EN_BROUILLON');
      },
      error: (error) => {
        this.drafting = false;
        this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.ERREUR_LORS_DU_RETOUR_AU_STATUT_BROUILLON'));
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
          this.successMessage = this.i18n.instant('AUTO.LE_CONTENU_ETIQUETTE_A_ETE_FINALISE_ET_FIGE');
          this.showFinalizedIndicator();
        },
        error: (error) => {
          this.finalizing = false;
          this.resetFinalizedIndicator();
          this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_FINALISATION_DE_L_ETIQUETTE'));
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
        this.successMessage = this.i18n.instant('AUTO.LE_JSON_ETIQUETTE_A_ETE_EXPORTE');
      },
      error: (error) => {
        this.exporting = false;
        this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.ERREUR_LORS_DE_L_EXPORT_DE_L_ETIQUETTE'));
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
      bestBeforeDate: '',
      ingredientDeclaration: '',
      ean13: '',
      harvestYear: '',
      acidityLevel: '',
      brandName: ''
    });
    this.compositionOverrides = {};
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
    const selectedPackaging = this.packagingOptions.find((sku) => sku.id === this.labelForm.value.packagingId);

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
    return resolveQualityGradeLabel(value);
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

    return item.name || item.label || item.libelle || item.designation || item.value || item.code || String(item.id || '');
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

  trackByCompositionKey(_index: number, entry: LabelCompositionEntry): string {
    return entry.key;
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
      bestBeforeDate: this.labelForm.value.bestBeforeDate?.trim() || undefined,
      ingredientDeclaration:
        this.labelForm.value.ingredientDeclaration?.trim() || buildIngredientDeclaration(this.labelForm.value.qualityGrade),
      nutritionDeclarationJson: this.buildNutritionDeclarationPayload(),
      ean13: this.labelForm.value.ean13?.trim() || undefined,
      harvestYear: this.labelForm.value.harvestYear?.trim() || undefined,
      acidityLevel: this.labelForm.value.acidityLevel?.trim() || undefined,
      brandName: this.labelForm.value.brandName?.trim() || undefined
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
    const selectedOp = this.resolveFiltrationOperation(requestedLotOrOperationId) || this.filtrationOperations[0];

    if (selectedOp) {
      this.labelForm.get('lotId')?.setValue(selectedOp.operationId);
      this.prefillFromFiltration(selectedOp);
      this.prefillSensoryProfileFromFiltrationQc(selectedOp);
    }

    this.labelForm.patchValue({
      packagingId: queryParams.get('packagingId') ?? this.labelForm.value.packagingId ?? '',
      packagingDate: queryParams.get('packagingDate') ?? this.labelForm.value.packagingDate ?? this.formatDateInput(new Date()),
      language: ((queryParams.get('language') as LabelLanguage | null) ?? this.labelForm.value.language ?? 'FR') as LabelLanguage
    });
  }

  private fetchLabelId(labelId: string): void {
    this.loadingLabel = true;
    this.clearMessages();

    this.labelService.getById(labelId).subscribe({
      next: (label) => {
        this.loadingLabel = false;
        this.syncFormWithLabel(label);
        this.successMessage = this.i18n.instant('AUTO.ETIQUETTE_CHARGEE_AVEC_SUCCES');
      },
      error: (error) => {
        this.loadingLabel = false;
        this.errorMessage = this.resolveErrorMessage(error, this.i18n.instant('AUTO.IMPOSSIBLE_DE_CHARGER_CETTE_ETIQUETTE'));
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

      qualityGrade: (label.qualityGrade as QualityGrades) || '',
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
      bestBeforeDate: label.bestBeforeDate || '',
      ingredientDeclaration: label.ingredientDeclaration || buildIngredientDeclaration(label.qualityGrade),
      ean13: label.ean13 || '',
      harvestYear: label.harvestYear || '',
      acidityLevel: label.acidityLevel || '',
      brandName: label.brandName || ''
    });
    this.loadCompositionOverridesFromLabel(label);
    this.applyCompanyDefaultsToForm();

    this.labelForm.markAsPristine();
    if (selectedOp) {
      this.prefillSensoryProfileFromFiltrationQc(selectedOp);
    }

    if (label.traceabilityLotId || label.lotId) {
      this.loadGenealogyForLabel(label.traceabilityLotId || label.lotId || '');
    }

    if (label.id && this.route.snapshot.paramMap.get('id') !== label.id) {
      this.router.navigate(['/labels', label.id], { replaceUrl: true });
    }
  }

  private resolveFiltrationOperation(id: string | null | undefined): FiltrationOperation | undefined {
    if (!id) {
      return undefined;
    }

    return this.filtrationOperations.find(
      (op) =>
        op.operationId === id || op.target?.id === id || op.source?.id === id || op.targetLotNumber === id || op.target?.lotNumber === id
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
        this.currentGenealogy = genealogy;
        const controls = this.resolvePostFiltrationQualityControls(genealogy);
        this.postFiltrationQualityControls = controls;
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

  private loadGenealogyForLabel(anchorId: string): void {
    if (!anchorId) {
      return;
    }

    this.productionTraceabilityService.getGenealogy(anchorId).subscribe({
      next: (genealogy) => {
        this.currentGenealogy = genealogy;
        this.postFiltrationQualityControls = this.resolvePostFiltrationQualityControls(genealogy);
      },
      error: () => {
        this.currentGenealogy = null;
      }
    });
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
    return [profile.addressLine1?.trim(), profile.postalCode?.trim(), profile.city?.trim(), profile.governorate?.trim()]
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

  private buildPreviewPayloadOptions() {
    const packaging = this.packagingOptions.find((product) => product.id === this.labelForm.getRawValue().packagingId);

    return {
      form: this.labelForm.getRawValue(),
      currentLabel: this.currentLabel,
      certifications: this.availableCertifications,
      brandName: this.companyProfile?.legalName,
      brandLogoData: this.companyProfile?.logoData,
      brandLogoContentType: this.companyProfile?.logoContentType,
      postFiltrationQualityControls: this.postFiltrationQualityControls,
      compositionOverrides: this.compositionOverrides,
      genealogy: this.currentGenealogy,
      productDensity: packaging?.density ?? null,
      resolveQualityLabel: (value: string | null | undefined) => this.resolveQualityLabel(value),
      resolveVarietyLabel: (value: string | null | undefined) => this.resolveVarietyLabel(value),
      resolveClaimLabel: (value: LabelClaimType | string) => this.resolveClaimLabel(value)
    };
  }
}

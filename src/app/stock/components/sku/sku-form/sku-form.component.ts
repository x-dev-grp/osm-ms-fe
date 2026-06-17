import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FinalProductService } from '../../../services/final-product.service';
import { FinalProduct, FinalProductType, FinalProductUnitOfMeasure, finalProductTypeLabel } from '../../../models/final-product.model';
import { QualityGrades } from '../../../../shared/models/quality-grades.enum';
import { ArticleService } from '../../../services/article.service';
import { Article, CategorieArticle } from '../../../models/article.model';
import { BomService } from '../../../services/BomService';
import { Bom } from '../../../models/Bom';
import { BomLine } from '../../../models/BomLine';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { StorageUnitDtoService } from '../../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../../shared/models/StorageUnitDto';
import { ProductLabelPreviewRailComponent } from '../product-label-preview-rail/product-label-preview-rail.component';
import { EanBarcodeComponent } from '../../../../labels/components/ean-barcode/ean-barcode.component';
import {
  APPROVED_PRODUCT_CATEGORIES,
  buildProductMandatoryChecklist,
  buildDefaultIngredientDeclaration,
  buildDefaultNutritionJson,
  DEFAULT_STORAGE_CONDITIONS,
  formatNutritionSummary,
  HARVEST_REGIONS,
  OLIVE_SOURCE_TYPES,
  OLIVE_VARIETIES,
  ORIGIN_COUNTRIES,
  PACKAGING_TYPES,
  parseOliveVarieties,
  PRODUCT_STATUSES,
  requiresAcidity,
  requiresHarvestYear,
  validateProductCompliance,
  VOLUME_OPTIONS_ML,
  oliveVarietiesToString
} from '../../../utils/product-compliance.util';


export interface BomLineUi {
  article: Article;
  quantity: number;
}

@Component({
  selector: 'app-sku-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    EanBarcodeComponent,
    ProductLabelPreviewRailComponent,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sku-form.component.html',
  styleUrls: ['./sku-form.component.scss']
})
export class SkuFormComponent implements OnInit {
  skuForm: FormGroup;
  isEditMode = false;
  skuId?: string;
  submitted = false;
  submitting = false;
  createTicketAfterSave = false;
  readonly productTypes: FinalProductType[] = ['VRAC', 'NON_VRAC'];
  readonly grades = APPROVED_PRODUCT_CATEGORIES;
  readonly packagingTypes = PACKAGING_TYPES;
  readonly originCountries = ORIGIN_COUNTRIES;
  readonly oliveVarieties = OLIVE_VARIETIES;
  readonly harvestRegions = HARVEST_REGIONS;
  readonly oliveSourceTypes = OLIVE_SOURCE_TYPES;
  readonly productStatuses = PRODUCT_STATUSES;
  readonly volumeOptions = VOLUME_OPTIONS_ML;
  readonly nutritionSummary = formatNutritionSummary();
  selectedOliveVarieties: string[] = [];
  railExpanded = true;
  readonly unitOptions: FinalProductUnitOfMeasure[] = ['L', 'KG', 'BOTTLE', 'CARTON'];
  storageUnits: StorageUnitDto[] = [];

  // --- BOM Builder state ---
  // BOM categories depend on product type:
  // - NON_VRAC (conditionné): full packaging chain
  // - VRAC: no packaging BOM needed
  readonly bomCategoriesConditionne: { key: CategorieArticle; label: string; icon: string }[] = [
    { key: CategorieArticle.UNITE,       label: 'Unité (Bouteille / Contenant)', icon: 'fa-wine-bottle' },
    { key: CategorieArticle.EMBALLAGE,   label: 'Emballage (Bouchon, Étiquette…)', icon: 'fa-tag' },
    { key: CategorieArticle.COLIS,       label: 'Colis (Carton)', icon: 'fa-boxes' },
    { key: CategorieArticle.PALETTE,     label: 'Palette', icon: 'fa-pallet' },
    { key: CategorieArticle.CONSOMMABLE, label: 'Consommable (Colle, Encre…)', icon: 'fa-flask' },
  ];

  get activeBomCategories() {
    return this.isNonVrac() ? this.bomCategoriesConditionne : [];
  }

  articlesByCategory: Partial<Record<CategorieArticle, Article[]>> = {};
  loadingArticles: Partial<Record<CategorieArticle, boolean>> = {};
  bomLines: BomLineUi[] = [];

  // Per-category picker state
  selectedArticleId: Partial<Record<CategorieArticle, string>> = {};
  selectedQuantity: Partial<Record<CategorieArticle, number>> = {};

  existingBoms: Bom[] = [];
  selectedBomId: string = '';
  loadingBoms = false;

  get codePlaceholder(): string {
    return this.isEditMode ? '' : 'Genere automatiquement apres creation';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private finalProductService: FinalProductService,
    private articleService: ArticleService,
    private bomService: BomService,
    private toast: ToastService,
    private campaignService: CampaignService,
    private storageUnitService: StorageUnitDtoService
  ) {
    this.skuForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      code: [''],
      type: ['NON_VRAC' as FinalProductType, [Validators.required]],
      category: [{ value: '', disabled: true }, [Validators.required]],
      unitOfMeasure: [{ value: 'BOTTLE', disabled: true }],
      description: [''],
      grade: ['' as QualityGrades | '', Validators.required],
      origin: ['Tunisia'],
      harvestCampaign: [''],
      harvestRegion: [''],
      volume: [null],
      packagingType: [''],
      barcode: [''],
      netWeight: [null, [Validators.min(0)]],
      grossWeight: [null, [Validators.min(0)]],
      brand: [''],
      brandDescription: [''],
      density: [null, [Validators.min(0)]],
      storageUnit: [''],
      productStatus: [{ value: 'DRAFT', disabled: true }],
      ingredientDeclaration: ['', Validators.required],
      storageConditions: [DEFAULT_STORAGE_CONDITIONS, Validators.required],
      shelfLifeMonths: [24, [Validators.min(1), Validators.max(60)]],
      acidityLevel: [''],
      peroxideValue: [''],
      k232: [''],
      k270: [''],
      polyphenolContent: [''],
      oliveVarieties: [''],
      organic: [false],
      organicCertNumber: [''],
      organicCertBody: [''],
      organicCertExpiry: [''],
      supplierName: [''],
      supplierCode: [''],
      supplierContact: [''],
      oliveSourceType: [''],
      oliveSourceReference: [''],
      productionBatchRef: [''],
      extractionBatchRef: [''],
      nutritionDeclarationJson: [buildDefaultNutritionJson()]
    });
  }

  ngOnInit(): void {
    this.skuId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.skuId;
    this.loadStorageUnits();
    if (!this.isEditMode) {
      this.skuForm.patchValue({
        harvestCampaign: this.campaignService.getCurrentCampaignLabel(),
        category: this.defaultCategoryForType(this.skuForm.get('type')?.value || 'NON_VRAC'),
        origin: 'Tunisia',
        storageConditions: DEFAULT_STORAGE_CONDITIONS,
        shelfLifeMonths: 24,
        nutritionDeclarationJson: buildDefaultNutritionJson()
      });
    }
    this.updateTypeFields(this.skuForm.get('type')?.value || 'NON_VRAC');
    this.skuForm.get('type')?.valueChanges.subscribe((type: FinalProductType) => {
      this.updateTypeFields(type, true);
    });
    this.skuForm.get('grade')?.valueChanges.subscribe((grade: QualityGrades | '') => {
      this.onGradeChange(grade);
    });

    // Pre-load all BOM categories
    this.bomCategoriesConditionne.forEach(cat => this.loadArticlesForCategory(cat.key));

    this.loadAllBoms();

    if (this.isEditMode) {
      this.loadSku();
    }
  }

  loadArticlesForCategory(cat: CategorieArticle): void {
    this.loadingArticles[cat] = true;
    this.articleService.getArticlesByCategorie(cat).subscribe({
      next: (articles) => {
        this.articlesByCategory[cat] = articles.filter(a => a.actif !== false);
        this.loadingArticles[cat] = false;
      },
      error: () => { this.loadingArticles[cat] = false; }
    });
  }

  addBomLine(cat: CategorieArticle): void {
    const articleId = this.selectedArticleId[cat];
    const quantity = this.selectedQuantity[cat] ?? 1;
    if (!articleId || quantity <= 0) return;

    const article = (this.articlesByCategory[cat] || []).find(a => a.id === articleId);
    if (!article) return;

    // Avoid duplicates – update quantity if already added
    const existing = this.bomLines.find(l => l.article.id === articleId);
    if (existing) {
      existing.quantity = quantity;
    } else {
      this.bomLines.push({ article, quantity });
    }

    // Reset picker for this category
    this.selectedArticleId[cat] = '';
    this.selectedQuantity[cat] = 1;
  }

  removeBomLine(index: number): void {
    this.bomLines.splice(index, 1);
  }

  getCatIcon(cat: CategorieArticle): string {
    return this.bomCategoriesConditionne.find(c => c.key === cat)?.icon ?? 'fa-box';
  }

  loadAllBoms(): void {
    this.loadingBoms = true;
    this.bomService.getAll().subscribe({
      next: (boms) => {
        this.existingBoms = boms;
        this.loadingBoms = false;
      },
      error: () => {
        this.loadingBoms = false;
      }
    });
  }

  applyExistingBom(bomId: string): void {
    this.selectedBomId = bomId || '';
    if (!bomId) {
      this.bomLines = [];
      return;
    }

    const selectedBom = this.existingBoms.find(b => b.id === bomId);
    if (!selectedBom || !selectedBom.lines) {
      this.bomLines = [];
      return;
    }

    // We copy the lines from the existing BOM
    this.bomLines = [];
    selectedBom.lines.forEach(line => {
      if (line.articleId) {
        this.articleService.getArticleById(line.articleId).subscribe({
          next: (article) => {
            this.bomLines.push({ article, quantity: line.quantity });
          },
          error: (err) => console.error('Error fetching article for BOM copy', err)
        });
      }
    });
  }

  loadSku(): void {
    this.finalProductService.getFinalProductById(this.skuId!).subscribe({
      next: (sku) => {
        this.skuForm.patchValue({
          name: sku.name || sku.code,
          code: sku.code || '',
          type: sku.type || 'NON_VRAC',
          category: sku.category || '',
          unitOfMeasure: sku.unitOfMeasure || (sku.type === 'VRAC' ? 'L' : 'BOTTLE'),
          description: sku.description || '',
          grade: sku.grade || '',
          origin: sku.origin || 'Tunisia',
          harvestCampaign: sku.harvestCampaign || '',
          harvestRegion: sku.harvestRegion || '',
          volume: sku.volume || null,
          packagingType: sku.packagingType || '',
          barcode: sku.barcode || '',
          netWeight: sku.netWeight || null,
          grossWeight: sku.grossWeight || null,
          brand: sku.brand || '',
          brandDescription: sku.brandDescription || '',
          density: sku.density || null,
          storageUnit: sku.storageUnit || '',
          productStatus: sku.productStatus || 'DRAFT',
          ingredientDeclaration: sku.ingredientDeclaration || buildDefaultIngredientDeclaration(sku.grade),
          storageConditions: sku.storageConditions || DEFAULT_STORAGE_CONDITIONS,
          shelfLifeMonths: sku.shelfLifeMonths ?? 24,
          acidityLevel: sku.acidityLevel || '',
          peroxideValue: sku.peroxideValue || '',
          k232: sku.k232 || '',
          k270: sku.k270 || '',
          polyphenolContent: sku.polyphenolContent || '',
          oliveVarieties: sku.oliveVarieties || '',
          organic: sku.organic ?? false,
          organicCertNumber: sku.organicCertNumber || '',
          organicCertBody: sku.organicCertBody || '',
          organicCertExpiry: sku.organicCertExpiry || '',
          supplierName: sku.supplierName || '',
          supplierCode: sku.supplierCode || '',
          supplierContact: sku.supplierContact || '',
          oliveSourceType: sku.oliveSourceType || '',
          oliveSourceReference: sku.oliveSourceReference || '',
          productionBatchRef: sku.productionBatchRef || '',
          extractionBatchRef: sku.extractionBatchRef || '',
          nutritionDeclarationJson: sku.nutritionDeclarationJson || buildDefaultNutritionJson()
        });
        this.selectedOliveVarieties = parseOliveVarieties(sku.oliveVarieties);
        this.updateTypeFields(sku.type || 'NON_VRAC');

        // Load BOM from product aggregate.
        if (sku.id && sku.bom?.lines) {
          sku.bom.lines.forEach((line: BomLine) => {
            if (line.articleId) {
              this.articleService.getArticleById(line.articleId).subscribe({
                next: (article) => {
                  this.bomLines.push({ article, quantity: line.quantity });
                }
              });
            }
          });
        } else if (sku.id) {
          this.bomService.getBomsByFinalProduct(sku.id).subscribe({
            next: (boms) => {
              if (boms?.length > 0 && boms[0].lines) {
                boms[0].lines.forEach((line: BomLine) => {
                  if (line.articleId) {
                    this.articleService.getArticleById(line.articleId).subscribe({
                      next: (article) => {
                        this.bomLines.push({ article, quantity: line.quantity });
                      }
                    });
                  }
                });
              }
            }
          });
        }
      },
      error: (err) => {
        console.error('Erreur chargement produit', err);
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LE_PRODUIT');
        this.router.navigate(['/stock/products']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.syncOliveVarietiesToForm();

    const missing = this.missingRequiredFields();
    if (missing.length > 0) {
      const labels = missing.map((i) => i.label).join(', ');
      this.toast.warning(`Conformité incomplète. Manquant : ${labels}`);
      return;
    }

    if (this.skuForm.invalid) {
      this.toast.warning('AUTO.VEUILLEZ_VERIFIER_LES_CHAMPS_DU_FORMULAIRE');
      return;
    }

    if (this.isNonVrac() && this.bomLines.length === 0) {
      this.toast.warning('Ajoutez au moins un article a la nomenclature du produit conditionne.');
      return;
    }

    this.submitting = true;
    const finalProduct: FinalProduct = {
      ...this.skuForm.getRawValue(),
      bom: this.isNonVrac()
        ? {
            lines: this.bomLines.map(l => ({
              articleId: l.article.id!,
              quantity: l.quantity,
              unitOfMeasure: l.article.um
            }))
          }
        : undefined
    };

    const saveFinalProduct$ = this.isEditMode
      ? this.finalProductService.updateFinalProduct(this.skuId!, finalProduct)
      : this.finalProductService.createFinalProduct(finalProduct);

    saveFinalProduct$.subscribe({
      next: (saved) => {
        const finalProductId = saved.id!;
        const shouldOpenTicket = this.createTicketAfterSave && this.isNonVrac();
        this.finishAfterSave(finalProductId, shouldOpenTicket);
      },
      error: (err) => {
        console.error('Erreur création/maj', err);
        this.toast.error(err.error?.message || 'AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT_DU_PRODUIT');
        this.submitting = false;
        this.createTicketAfterSave = false;
      }
    });
  }

  saveAndCreateTicket(): void {
    this.createTicketAfterSave = true;
    this.onSubmit();
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/products', this.skuId]);
    } else {
      this.router.navigate(['/stock/products']);
    }
  }

  get f() { return this.skuForm.controls; }
  isVrac(): boolean { return this.skuForm.get('type')?.value === 'VRAC'; }
  isNonVrac(): boolean { return !this.isVrac(); }
  formatFinalProductType(type?: FinalProductType): string { return finalProductTypeLabel(type); }
  showHarvestRequired(): boolean { return requiresHarvestYear(this.skuForm.get('grade')?.value); }
  showAcidityRequired(): boolean { return requiresAcidity(this.skuForm.get('grade')?.value); }
  isOrganic(): boolean { return !!this.skuForm.get('organic')?.value; }

  pageTitle(): string {
    return this.isEditMode ? 'Modifier le produit' : 'Nouveau produit';
  }

  statusLabel(): string {
    const status = this.skuForm.get('productStatus')?.value || 'DRAFT';
    switch (status) {
      case 'APPROVED': return 'Approuvé';
      case 'ACTIVE': return 'Actif';
      case 'PENDING_REVIEW': return 'En revue';
      case 'INACTIVE': return 'Inactif';
      case 'ARCHIVED': return 'Archivé';
      default: return 'Brouillon';
    }
  }

  get mandatoryChecklist() {
    return buildProductMandatoryChecklist(
      this.skuForm.get('type')?.value || 'NON_VRAC',
      this.skuForm.get('grade')?.value,
      this.skuForm.get('organic')?.value
    );
  }

  missingRequiredFields(): { field: string; label: string }[] {
    const type = this.skuForm.get('type')?.value as FinalProductType;
    const issues = validateProductCompliance(this.skuForm.getRawValue(), type);
    if (this.isNonVrac() && this.bomLines.length === 0) {
      issues.push({ field: 'bom', label: 'Nomenclature BOM' });
    }
    return issues;
  }

  isChecklistItemMissing(field: string): boolean {
    return this.missingRequiredFields().some((item) => item.field === field);
  }

  complianceReadyCount(): number {
    return this.mandatoryChecklist.filter((item) => !this.isChecklistItemMissing(item.field)).length;
  }

  compliancePercent(): number {
    const total = this.mandatoryChecklist.length;
    if (!total) {
      return 100;
    }
    return Math.round((this.complianceReadyCount() / total) * 100);
  }

  canSave(): boolean {
    return this.missingRequiredFields().length === 0;
  }

  setProductType(type: FinalProductType): void {
    this.skuForm.get('type')?.setValue(type);
  }

  toggleComplianceRail(): void {
    this.railExpanded = !this.railExpanded;
  }

  toggleOliveVariety(variety: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedOliveVarieties.includes(variety)) {
        this.selectedOliveVarieties = [...this.selectedOliveVarieties, variety];
      }
    } else {
      this.selectedOliveVarieties = this.selectedOliveVarieties.filter((v) => v !== variety);
    }
    this.syncOliveVarietiesToForm();
  }

  isVarietySelected(variety: string): boolean {
    return this.selectedOliveVarieties.includes(variety);
  }

  private syncOliveVarietiesToForm(): void {
    this.skuForm.patchValue({ oliveVarieties: oliveVarietiesToString(this.selectedOliveVarieties) }, { emitEvent: false });
  }

  private onGradeChange(grade: QualityGrades | ''): void {
    const ingredientControl = this.skuForm.get('ingredientDeclaration');
    if (!ingredientControl?.value?.trim() && grade) {
      ingredientControl?.setValue(buildDefaultIngredientDeclaration(grade));
    }
    this.updateConditionalValidators(grade);
  }

  private updateConditionalValidators(grade: QualityGrades | ''): void {
    const harvestControl = this.skuForm.get('harvestCampaign');
    const acidityControl = this.skuForm.get('acidityLevel');
    if (requiresHarvestYear(grade)) {
      harvestControl?.setValidators([Validators.required]);
    } else {
      harvestControl?.clearValidators();
    }
    if (requiresAcidity(grade)) {
      acidityControl?.setValidators([Validators.required]);
    } else {
      acidityControl?.clearValidators();
    }
    harvestControl?.updateValueAndValidity({ emitEvent: false });
    acidityControl?.updateValueAndValidity({ emitEvent: false });
  }

  get vracUnitOptions(): FinalProductUnitOfMeasure[] { return ['L', 'KG']; }
  get conditionneUnitOptions(): FinalProductUnitOfMeasure[] { return ['BOTTLE', 'CARTON']; }
  get currentUnitOptions(): FinalProductUnitOfMeasure[] {
    return this.isVrac() ? this.vracUnitOptions : this.conditionneUnitOptions;
  }

  openNewArticle(categorie?: CategorieArticle): void {
    const url = categorie
      ? `/stock/articles/nouveau?categorie=${categorie}`
      : '/stock/articles/nouveau';
    window.open(url, '_blank');
  }

  openNewBom(): void {
    const finalProductId = this.skuId || this.route.snapshot.params['id'] || null;
    if (finalProductId) {
      this.router.navigate(['/stock/boms/nouveau'], {
        queryParams: { finalProductId }
      });
      return;
    }

    if (this.skuForm.invalid) {
      this.submitted = true;
      this.skuForm.markAllAsTouched();
      this.toast.warning('AUTO.RENSEIGNEZ_LES_CHAMPS_OBLIGATOIRES_DU_PRODUIT_AVANT_DE_CREER_LA_');
      return;
    }

    const finalProduct: FinalProduct = this.skuForm.getRawValue();
    this.submitting = true;

    this.finalProductService.createFinalProduct(finalProduct).subscribe({
      next: (saved) => {
        this.submitting = false;
        const savedId = saved.id;
        if (!savedId) {
          this.toast.error('AUTO.PRODUIT_CREE_SANS_IDENTIFIANT_IMPOSSIBLE_DE_PRESELECTIONNER_LA_B');
          return;
        }

        this.skuId = savedId;
        this.toast.success('AUTO.PRODUIT_CREE_OUVERTURE_DE_LA_CREATION_BOM');
        this.router.navigate(['/stock/boms/nouveau'], {
          queryParams: { finalProductId: savedId }
        });
      },
      error: (err) => {
        this.submitting = false;
        this.toast.error(err?.error?.message || 'AUTO.IMPOSSIBLE_DE_CREER_LE_PRODUIT_AVANT_LA_BOM');
      }
    });
  }

  private updateTypeFields(type: FinalProductType, clearMismatch = false): void {
    const volumeControl = this.skuForm.get('volume');
    const unitControl = this.skuForm.get('unitOfMeasure');
    const categoryControl = this.skuForm.get('category');
    const nonVracFields = [
      'volume', 'packagingType', 'barcode', 'netWeight', 'grossWeight', 'brand',
      'shelfLifeMonths', 'supplierName', 'supplierCode', 'oliveSourceType',
      'oliveSourceReference', 'productionBatchRef', 'extractionBatchRef'
    ];

    if (type === 'VRAC') {
      unitControl?.setValue(!unitControl?.value || unitControl.value === 'BOTTLE' || unitControl.value === 'CARTON' ? 'L' : unitControl.value, { emitEvent: false });
      volumeControl?.clearValidators();
      if (clearMismatch) {
        nonVracFields.forEach(c => this.skuForm.get(c)?.reset(c === 'volume' || c === 'netWeight' || c === 'grossWeight' || c === 'shelfLifeMonths' ? (c === 'shelfLifeMonths' ? 24 : null) : '', { emitEvent: false }));
      }
    } else {
      unitControl?.setValue(unitControl.value === 'L' || !unitControl.value ? 'BOTTLE' : unitControl.value, { emitEvent: false });
      volumeControl?.setValidators([Validators.required, Validators.min(0.001)]);
      this.skuForm.get('brand')?.setValidators([Validators.required]);
      this.skuForm.get('origin')?.setValidators([Validators.required]);
      this.skuForm.get('packagingType')?.setValidators([Validators.required]);
      this.skuForm.get('shelfLifeMonths')?.setValidators([Validators.required, Validators.min(1), Validators.max(60)]);
      this.skuForm.get('supplierName')?.setValidators([Validators.required]);
      this.skuForm.get('supplierCode')?.setValidators([Validators.required]);
      this.skuForm.get('oliveSourceType')?.setValidators([Validators.required]);
      this.skuForm.get('oliveSourceReference')?.setValidators([Validators.required]);
      this.skuForm.get('productionBatchRef')?.setValidators([Validators.required]);
      this.skuForm.get('extractionBatchRef')?.setValidators([Validators.required]);
      if (clearMismatch) {
        ['density', 'storageUnit']
          .forEach(c => this.skuForm.get(c)?.reset(c === 'density' ? null : '', { emitEvent: false }));
      }
    }

    const defaultUnit = type === 'VRAC' ? 'L' : 'BOTTLE';
    unitControl?.setValue(defaultUnit, { emitEvent: false });

    if (categoryControl) {
      categoryControl.setValue(this.defaultCategoryForType(type), { emitEvent: false });
    }
    volumeControl?.updateValueAndValidity({ emitEvent: false });
    this.updateConditionalValidators(this.skuForm.get('grade')?.value || '');
  }

  loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit().subscribe({
      next: (resp) => {
        if (resp && resp.data) {
          this.storageUnits = resp.data;
        }
      },
      error: (err) => {
        console.error('Erreur chargement des cuves:', err);
      }
    });
  }

  private defaultCategoryForType(type: FinalProductType): string {
    return type === 'VRAC' ? 'Huile Vrac' : 'Produit Conditionne';
  }

  private openTicketCreation(productId: string): void {
    this.createTicketAfterSave = false;
    this.submitting = false;
    this.router.navigate(['/labels/new'], {
      queryParams: { packagingId: productId }
    });
  }

  private deleteFinalProductBom(finalProductId: string, done: () => void): void {
    this.bomService.getBomsByFinalProduct(finalProductId).subscribe({
      next: (boms) => {
        const bom = boms?.[0];
        if (!bom?.id) {
          done();
          return;
        }
        this.bomService.delete(bom.id).subscribe({
          next: done,
          error: () => done()
        });
      },
      error: () => done()
    });
  }

  private finishAfterSave(finalProductId: string, shouldOpenTicket: boolean): void {
    this.toast.success(this.isEditMode ? 'AUTO.PRODUIT_MIS_A_JOUR_AVEC_SUCCES' : 'AUTO.PRODUIT_CREE_AVEC_SUCCES');
    if (shouldOpenTicket) {
      this.openTicketCreation(finalProductId);
    } else {
      this.submitting = false;
      this.createTicketAfterSave = false;
      this.router.navigate(['/stock/products', finalProductId]);
    }
  }
}

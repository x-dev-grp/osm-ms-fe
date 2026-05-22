import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SKUService } from '../../../services/sku.service';
import { ProductType, ProductUnitOfMeasure, SKU, productTypeLabel } from '../../../models/sku.model';
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
import { ProductLabelsComponent } from '../product-labels/product-labels.component';


export interface BomLineUi {
  article: Article;
  quantity: number;
}

@Component({
  selector: 'app-sku-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ProductLabelsComponent],
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
  readonly productTypes: ProductType[] = ['VRAC', 'NON_VRAC'];
  readonly unitOptions: ProductUnitOfMeasure[] = ['L', 'KG', 'BOTTLE', 'CARTON'];
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
    private skuService: SKUService,
    private articleService: ArticleService,
    private bomService: BomService,
    private toast: ToastService,
    private campaignService: CampaignService,
    private storageUnitService: StorageUnitDtoService
  ) {
    this.skuForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [''],
      type: ['NON_VRAC' as ProductType, [Validators.required]],
      category: [''],
      unitOfMeasure: ['BOTTLE'],
      description: [''],
      grade: [''],
      origin: [''],
      harvestCampaign: [''],
      volume: [null],
      barcode: [''],
      netWeight: [null, [Validators.min(0)]],
      grossWeight: [null, [Validators.min(0)]],
      brand: [''],
      density: [null, [Validators.min(0)]],
      storageUnit: ['']
    });
  }

  ngOnInit(): void {
    this.skuId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.skuId;
    this.loadStorageUnits();
    if (!this.isEditMode) {
      this.skuForm.patchValue({
        harvestCampaign: this.campaignService.getCurrentCampaignLabel()
      });
    }
    this.updateTypeFields(this.skuForm.get('type')?.value || 'NON_VRAC');
    this.skuForm.get('type')?.valueChanges.subscribe((type: ProductType) => {
      this.updateTypeFields(type, true);
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
    this.skuService.getProductById(this.skuId!).subscribe({
      next: (sku) => {
        this.skuForm.patchValue({
          name: sku.name || sku.code,
          code: sku.code || '',
          type: sku.type || 'NON_VRAC',
          category: sku.category || '',
          unitOfMeasure: sku.unitOfMeasure || (sku.type === 'VRAC' ? 'L' : 'BOTTLE'),
          description: sku.description || '',
          grade: sku.grade || '',
          origin: sku.origin || '',
          harvestCampaign: sku.harvestCampaign || '',
          volume: sku.volume || null,
          barcode: sku.barcode || '',
          netWeight: sku.netWeight || null,
          grossWeight: sku.grossWeight || null,
          brand: sku.brand || '',
          density: sku.density || null,
          storageUnit: sku.storageUnit || ''
        });
        this.updateTypeFields(sku.type || 'NON_VRAC');

        // Load existing BOM lines for this SKU
        if (sku.id) {
          this.bomService.getBomsByProduct(sku.id).subscribe({
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
        this.toast.error('Impossible de charger le produit');
        this.router.navigate(['/stock/products']);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.skuForm.invalid) {
      this.toast.warning('Veuillez verifier les champs du formulaire');
      return;
    }

    this.submitting = true;
    const sku: SKU = this.skuForm.getRawValue();

    const saveSku$ = this.isEditMode
      ? this.skuService.updateProduct(this.skuId!, sku)
      : this.skuService.createProduct(sku);

    saveSku$.subscribe({
      next: (saved) => {
        const skuId = saved.id!;
        const shouldOpenTicket = this.createTicketAfterSave && this.isNonVrac();
        if (this.bomLines.length > 0) {
          const bom = {
            productId: skuId,
            version: '1.0',
            lines: this.bomLines.map(l => ({
              articleId: l.article.id!,
              quantity: l.quantity,
              unitOfMeasure: l.article.um
            }))
          };
          this.bomService.create(bom as any).subscribe({
            next: () => {
              this.toast.success(this.isEditMode ? 'Produit mis a jour avec succes' : 'Produit cree avec succes');
              if (shouldOpenTicket) {
                this.openTicketCreation(skuId);
              } else {
                this.router.navigate(['/stock/products', skuId]);
              }
            },
            error: () => {
              this.toast.warning('Produit enregistre, mais la nomenclature n a pas pu etre creee');
              if (shouldOpenTicket) {
                this.openTicketCreation(skuId);
              } else {
                this.router.navigate(['/stock/products', skuId]);
              }
            }
          });
        } else {
          this.toast.success(this.isEditMode ? 'Produit mis a jour avec succes' : 'Produit cree avec succes');
          if (shouldOpenTicket) {
            this.openTicketCreation(skuId);
          } else {
            this.router.navigate(['/stock/products', skuId]);
          }
        }
      },
      error: (err) => {
        console.error('Erreur création/maj', err);
        this.toast.error(err.error?.message || 'Erreur lors de l enregistrement du produit');
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
  formatProductType(type?: ProductType): string { return productTypeLabel(type); }

  get vracUnitOptions(): ProductUnitOfMeasure[] { return ['L', 'KG']; }
  get conditionneUnitOptions(): ProductUnitOfMeasure[] { return ['BOTTLE', 'CARTON']; }
  get currentUnitOptions(): ProductUnitOfMeasure[] {
    return this.isVrac() ? this.vracUnitOptions : this.conditionneUnitOptions;
  }

  openNewArticle(categorie?: CategorieArticle): void {
    const url = categorie
      ? `/stock/articles/nouveau?categorie=${categorie}`
      : '/stock/articles/nouveau';
    window.open(url, '_blank');
  }

  private updateTypeFields(type: ProductType, clearMismatch = false): void {
    const volumeControl = this.skuForm.get('volume');
    const unitControl = this.skuForm.get('unitOfMeasure');

    if (type === 'VRAC') {
      unitControl?.setValue(!unitControl?.value || unitControl.value === 'BOTTLE' || unitControl.value === 'CARTON' ? 'L' : unitControl.value, { emitEvent: false });
      volumeControl?.clearValidators();
      if (clearMismatch) {
        ['volume', 'barcode', 'netWeight', 'grossWeight', 'brand']
          .forEach(c => this.skuForm.get(c)?.reset(c === 'volume' ? null : '', { emitEvent: false }));
      }
    } else {
      unitControl?.setValue(unitControl.value === 'L' || !unitControl.value ? 'BOTTLE' : unitControl.value, { emitEvent: false });
      volumeControl?.setValidators([Validators.required, Validators.min(0.001)]);
      if (clearMismatch) {
        ['density', 'storageUnit']
          .forEach(c => this.skuForm.get(c)?.reset(c === 'density' ? null : '', { emitEvent: false }));
      }
    }
    volumeControl?.updateValueAndValidity({ emitEvent: false });
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

  private openTicketCreation(productId: string): void {
    this.createTicketAfterSave = false;
    this.submitting = false;
    this.router.navigate(['/labels/new'], {
      queryParams: { packagingId: productId }
    });
  }
}

import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { MaterielSupplierService } from '../../../services/materiel-supplier.service';
import { Article, CategorieArticle, UniteMesure, UniteMesureOption, ArticleConfig, categorieLabels } from '../../../models/article.model';
import { MaterielSupplier } from '../../../models/materiel-supplier.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.scss']
})
export class ArticleFormComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  articleForm: FormGroup;
  categories = Object.values(CategorieArticle);
  allUnitesMesure: UniteMesureOption[] = this.getFallbackUnitesMesure();
  unitesMesure: UniteMesureOption[] = [...this.allUnitesMesure];
  categorieLabels = categorieLabels;
  materielSuppliers: MaterielSupplier[] = [];
  uniteArticles: Article[] = [];
  loadingUnites = false;
  loadingUnitesMesure = false;
  colisArticles: Article[] = [];
  loadingColis = false;

  isEditMode = false;
  articleId?: string;
  submitted = false;
  submitting = false;

  private readonly defaultUniteByCategorie: Record<CategorieArticle, UniteMesure> = {
    [CategorieArticle.UNITE]: UniteMesure.UNITE,
    [CategorieArticle.COLIS]: UniteMesure.UNITE,
    [CategorieArticle.PALETTE]: UniteMesure.UNITE,
    [CategorieArticle.EMBALLAGE]: UniteMesure.UNITE,
    [CategorieArticle.CONSOMMABLE]: UniteMesure.KG
  };

  private readonly unitesMesureByCategorie: Record<CategorieArticle, UniteMesure[]> = {
    [CategorieArticle.UNITE]: [UniteMesure.UNITE],
    [CategorieArticle.COLIS]: [UniteMesure.UNITE],
    [CategorieArticle.PALETTE]: [UniteMesure.UNITE],
    [CategorieArticle.EMBALLAGE]: [UniteMesure.UNITE, UniteMesure.METRE, UniteMesure.KG],
    [CategorieArticle.CONSOMMABLE]: [UniteMesure.KG, UniteMesure.LITRE, UniteMesure.METRE, UniteMesure.UNITE]
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private materielSupplierService: MaterielSupplierService,
  ) {
    this.articleForm = this.fb.group({
      nom: ['', Validators.required],
      categorie: ['', Validators.required],
      um: ['', Validators.required],
      materielSupplier: [''],
      stockMinimum: [0, [Validators.min(0)]],
      stockMaximum: [0, [Validators.min(0)]],
      actif: [true],

      uniteMaterial: [''],
      uniteVolumeMl: [0],
      uniteColor: [''],
      uniteNeckType: [''],
      uniteWeightGr: [0],

      colisUnitArticleId: [''],
      colisUnitsPerColis: [0],
      colisLength: [0],
      colisWidth: [0],
      colisHeight: [0],
      colisMaxWeightKg: [0],


      paletteType: [''],
      paletteMaterial: [''],
      paletteColisPerLayer: [0],
      paletteNumberOfLayers: [0],
      paletteMaxHeightCm: [0],
      paletteClientSpecific: [false],
      paletteColisId: [''],

      emballageSousType: [''],
      emballageMaterial: [''],
      emballageLength: [0],
      emballageWidth: [0],
      emballageHeight: [0],
      emballageClientBranding: [false],
      emballagePoidsGrammes: [0],

      consommableSousType: [''],
      consommableUsage: [''],
      consommableUnit: [''],
      consommableQuantity: [0],
      consommableTemperatureStockage: [0]
    });
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.articleId;
    this.loadMaterielSuppliers();
    this.loadUnitesMesure();
    if (this.isEditMode) {
      this.loadArticle();
    }

    // Pre-select category if passed as query param (from SKU BOM builder "Créer →" link)
    const preselectedCategorie = this.route.snapshot.queryParams['categorie'] as CategorieArticle;
    if (preselectedCategorie && Object.values(CategorieArticle).includes(preselectedCategorie)) {
      this.articleForm.get('categorie')?.setValue(preselectedCategorie, { emitEvent: false });
      this.handleCategoryChange(preselectedCategorie);
    }

    this.articleForm.get('categorie')?.valueChanges.subscribe(cat => {
      this.handleCategoryChange(cat);
    });

    this.setupAutoCalculations();
  }

  loadMaterielSuppliers(): void {
    this.materielSupplierService.getActive().subscribe({
      next: (data) => {
        this.materielSuppliers = data;
      },
      error: (error) => console.error('Erreur chargement fournisseurs materiel:', error)
    });
  }

  loadUnitesMesure(): void {
    this.loadingUnitesMesure = true;
    this.articleService.getUnitesMesure().subscribe({
      next: (unites) => {
        this.allUnitesMesure = unites?.length ? unites : this.getFallbackUnitesMesure();
        this.updateUnitesMesureForCategorie(this.articleForm.get('categorie')?.value, true);
        this.ensureSelectedUniteMesureOption();
        this.loadingUnitesMesure = false;
      },
      error: (error) => {
        console.error('Erreur chargement unites de mesure:', error);
        this.allUnitesMesure = this.getFallbackUnitesMesure();
        this.updateUnitesMesureForCategorie(this.articleForm.get('categorie')?.value, true);
        this.ensureSelectedUniteMesureOption();
        this.loadingUnitesMesure = false;
      }
    });
  }

  private getFallbackUnitesMesure(): UniteMesureOption[] {
    return Object.values(UniteMesure).map((value) => ({
      value,
      label: this.getUniteMesureLabel(value)
    }));
  }

  private getUniteMesureLabel(value: string): string {
    const labels: Record<string, string> = {
      KG: 'Kilogramme (KG)',
      LITRE: 'Litre',
      UNITE: 'Unite',
      METRE: 'Metre'
    };

    return labels[value] || value;
  }

  private ensureSelectedUniteMesureOption(): void {
    const selectedUnite = this.articleForm.get('um')?.value;
    if (!selectedUnite || this.unitesMesure.some((unite) => unite.value === selectedUnite)) {
      return;
    }

    this.unitesMesure = [
      { value: selectedUnite, label: this.getUniteMesureLabel(selectedUnite) },
      ...this.unitesMesure
    ];
  }

  private updateUnitesMesureForCategorie(cat: string, preserveCurrentUnit = false): void {
    if (!Object.values(CategorieArticle).includes(cat as CategorieArticle)) {
      this.unitesMesure = [...this.allUnitesMesure];
      return;
    }

    const categorie = cat as CategorieArticle;
    const allowedValues = this.unitesMesureByCategorie[categorie];
    this.unitesMesure = this.allUnitesMesure.filter((unite) =>
      allowedValues.includes(unite.value as UniteMesure)
    );

    const currentUnit = this.articleForm.get('um')?.value;
    if (preserveCurrentUnit && currentUnit && allowedValues.includes(currentUnit as UniteMesure)) {
      return;
    }

    this.articleForm.get('um')?.setValue(this.defaultUniteByCategorie[categorie], { emitEvent: false });
  }

  loadColisArticles(): void {
    this.loadingColis = true;
    this.articleService.getArticlesByCategorie(CategorieArticle.COLIS).subscribe({
      next: (articles) => {
        this.colisArticles = articles;
        this.loadingColis = false;
      },
      error: (err) => {
        console.error('Erreur chargement articles colis:', err);
        this.loadingColis = false;
        this.colisArticles = [];
      }
    });
  }

  loadUniteArticles(): void {
    this.loadingUnites = true;
    this.articleService.getArticlesByCategorie(CategorieArticle.UNITE).subscribe({
      next: (articles) => {
        this.uniteArticles = articles;
        this.loadingUnites = false;
      },
      error: (err) => {
        console.error('Erreur chargement articles unité:', err);
        this.loadingUnites = false;
        this.uniteArticles = [];
      }
    });
  }

  handleCategoryChange(cat: string, preserveCurrentUnit = false): void {
    this.updateUnitesMesureForCategorie(cat, preserveCurrentUnit);

    // 1. Load related articles if needed
    if (cat === CategorieArticle.COLIS) {
      this.loadUniteArticles();
    }
    if (cat === CategorieArticle.PALETTE) {
      this.loadColisArticles();
    }

    // 2. Set dynamic strict validations
    this.clearAllDynamicValidators();

    switch (cat) {
      case CategorieArticle.UNITE:
        this.setValidators('uniteVolumeMl', [Validators.required, Validators.min(0.1)]);
        break;
      case CategorieArticle.COLIS:
        this.setValidators('colisUnitArticleId', [Validators.required]);
        this.setValidators('colisUnitsPerColis', [Validators.required, Validators.min(1)]);
        this.setValidators('colisLength', [Validators.required, Validators.min(0.1)]);
        this.setValidators('colisWidth', [Validators.required, Validators.min(0.1)]);
        this.setValidators('colisHeight', [Validators.required, Validators.min(0.1)]);
        break;
      case CategorieArticle.PALETTE:
        this.setValidators('paletteColisId', [Validators.required]);
        this.setValidators('paletteColisPerLayer', [Validators.required, Validators.min(1)]);
        this.setValidators('paletteNumberOfLayers', [Validators.required, Validators.min(1)]);
        break;
      case CategorieArticle.EMBALLAGE:
        // Either dimensions or weight is required conceptually, but we can leave it flexible
        break;
    }
  }

  clearAllDynamicValidators(): void {
    const dynamicFields = [
      'uniteVolumeMl', 'colisUnitArticleId', 'colisUnitsPerColis',
      'colisLength', 'colisWidth', 'colisHeight',
      'paletteColisId', 'paletteColisPerLayer', 'paletteNumberOfLayers'
    ];

    dynamicFields.forEach(field => {
      const control = this.articleForm.get(field);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  setValidators(fieldName: string, validators: any[]): void {
    const control = this.articleForm.get(fieldName);
    if (control) {
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private normalizeEmptySelectValue(value: unknown): string {
    if (value === null || value === undefined || value === 'null') {
      return '';
    }

    return String(value).trim();
  }

  private normalizeNumberValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeArticleFormValues(): void {
    const categorie = this.articleForm.get('categorie')?.value;
    const normalizedValues: Record<string, unknown> = {
      nom: this.normalizeEmptySelectValue(this.articleForm.get('nom')?.value),
      categorie: this.normalizeEmptySelectValue(categorie),
      um: this.normalizeEmptySelectValue(this.articleForm.get('um')?.value),
      materielSupplier: this.normalizeEmptySelectValue(this.articleForm.get('materielSupplier')?.value),
      stockMinimum: this.normalizeNumberValue(this.articleForm.get('stockMinimum')?.value),
      stockMaximum: this.normalizeNumberValue(this.articleForm.get('stockMaximum')?.value)
    };

    if (categorie === CategorieArticle.COLIS) {
      Object.assign(normalizedValues, {
        um: this.normalizeEmptySelectValue(this.articleForm.get('um')?.value) || UniteMesure.UNITE,
        colisUnitArticleId: this.normalizeEmptySelectValue(this.articleForm.get('colisUnitArticleId')?.value),
        colisUnitsPerColis: this.normalizeNumberValue(this.articleForm.get('colisUnitsPerColis')?.value),
        colisLength: this.normalizeNumberValue(this.articleForm.get('colisLength')?.value),
        colisWidth: this.normalizeNumberValue(this.articleForm.get('colisWidth')?.value),
        colisHeight: this.normalizeNumberValue(this.articleForm.get('colisHeight')?.value),
        colisMaxWeightKg: this.normalizeNumberValue(this.articleForm.get('colisMaxWeightKg')?.value)
      });
    }

    this.articleForm.patchValue(normalizedValues, { emitEvent: false });
    this.articleForm.updateValueAndValidity({ emitEvent: false });
  }

  setupAutoCalculations(): void {
    // Colis: Auto-calculate Max Weight based on unit weight * units
    this.articleForm.get('colisUnitsPerColis')?.valueChanges.subscribe(units => {
      this.calculateColisMaxWeight(units, this.articleForm.get('colisUnitArticleId')?.value);
    });

    this.articleForm.get('colisUnitArticleId')?.valueChanges.subscribe(unitId => {
      this.calculateColisMaxWeight(this.articleForm.get('colisUnitsPerColis')?.value, unitId);
    });
  }

  calculateColisMaxWeight(units: number, unitId: string): void {
    if (units && unitId && this.uniteArticles.length > 0) {
      const unit = this.uniteArticles.find(u => u.id === unitId);
      if (unit && unit.configuration && (unit.configuration as any).weightGr) {
        const weightGr = (unit.configuration as any).weightGr;
        // Poids total en KG (poids unitaire * nbr d'unités / 1000)
        const totalWeightKg = (weightGr * units) / 1000;
        // On met à jour le champ (si l'utilisateur ne l'a pas déjà écrasé)
        this.articleForm.patchValue({ colisMaxWeightKg: totalWeightKg }, { emitEvent: false });
      }
    }
  }

  loadArticle(): void {
    this.articleService.getArticleById(this.articleId!).subscribe({
      next: (article) => {
        this.articleForm.patchValue({
          nom: article.nom,
          categorie: article.categorie,
          um: article.um,
          materielSupplier: article.materielSupplier?.id ?? '',
          stockMinimum: article.stockMinimum,
          stockMaximum: article.stockMaximum,
          actif: article.actif
        }, { emitEvent: false });
        this.handleCategoryChange(article.categorie, true);
        this.ensureSelectedUniteMesureOption();

        const config = article.configuration;
        if (config) {
          switch (article.categorie) {
            case CategorieArticle.UNITE:
              this.articleForm.patchValue({
                uniteMaterial: (config as any).material,
                uniteVolumeMl: (config as any).volumeMl,
                uniteColor: (config as any).color,
                uniteNeckType: (config as any).neckType,
                uniteWeightGr: (config as any).weightGr
              });
              break;
            case CategorieArticle.COLIS:
              this.articleForm.patchValue({
                colisUnitArticleId: (config as any).unitArticleId,
                colisUnitsPerColis: (config as any).unitsPerColis,
                colisLength: (config as any).dimensions.length,
                colisWidth: (config as any).dimensions.width,
                colisHeight: (config as any).dimensions.height,
                colisMaxWeightKg: (config as any).maxWeightKg
              });
              break;
            case CategorieArticle.PALETTE:
              this.articleForm.patchValue({
                paletteType: (config as any).type,
                paletteMaterial: (config as any).material,
                paletteColisPerLayer: (config as any).colisPerLayer,
                paletteNumberOfLayers: (config as any).numberOfLayers,
                paletteMaxHeightCm: (config as any).maxHeightCm,
                paletteClientSpecific: (config as any).clientSpecific,
                paletteColisId: (config as any).colisId
              });
              break;
            case CategorieArticle.EMBALLAGE:
              this.articleForm.patchValue({
                emballageSousType: (config as any).sousType,
                emballageMaterial: (config as any).material,
                emballageLength: (config as any).dimensions?.length || 0,
                emballageWidth: (config as any).dimensions?.width || 0,
                emballageHeight: (config as any).dimensions?.height || 0,
                emballageClientBranding: (config as any).clientBranding,
                emballagePoidsGrammes: (config as any).poidsGrammes || 0
              });
              break;
            case CategorieArticle.CONSOMMABLE:
              this.articleForm.patchValue({
                consommableSousType: (config as any).sousType,
                consommableUsage: (config as any).usage,
                consommableUnit: (config as any).unit,
                consommableQuantity: (config as any).quantity,
                consommableTemperatureStockage: (config as any).temperatureStockageCelsius
              });
              break;


          }
        }
      },
      error: (error) => {
        console.error('Erreur chargement article:', error);
        this.router.navigate(['/stock/articles']);
      }
    });
  }

  private buildConfiguration(): ArticleConfig {
    const categorie = this.articleForm.get('categorie')?.value;
    const form = this.articleForm.value;

    switch (categorie) {
      case CategorieArticle.UNITE:
        return {
          configType: 'UNITE',
          material: form.uniteMaterial,
          volumeMl: form.uniteVolumeMl,
          color: form.uniteColor,
          neckType: form.uniteNeckType,
          weightGr: form.uniteWeightGr
        };
      case CategorieArticle.COLIS:
        return {
          configType: 'COLIS',
          unitArticleId: form.colisUnitArticleId,
          unitsPerColis: form.colisUnitsPerColis,
          dimensions: {
            length: form.colisLength,
            width: form.colisWidth,
            height: form.colisHeight
          },
          maxWeightKg: form.colisMaxWeightKg
        };
      case CategorieArticle.PALETTE:
        return {
          configType: 'PALETTE',
          type: form.paletteType,
          material: form.paletteMaterial,
          colisPerLayer: form.paletteColisPerLayer,
          numberOfLayers: form.paletteNumberOfLayers,
          maxHeightCm: form.paletteMaxHeightCm,
          clientSpecific: form.paletteClientSpecific,
          colisId: form.paletteColisId
        };
      case CategorieArticle.EMBALLAGE:
        const dimensions = (form.emballageLength || form.emballageWidth || form.emballageHeight)
          ? {
            length: form.emballageLength || 0,
            width: form.emballageWidth || 0,
            height: form.emballageHeight || 0
          }
          : undefined;
        return {
          configType: 'EMBALLAGE',
          sousType: form.emballageSousType,
          material: form.emballageMaterial,
          dimensions: dimensions,
          clientBranding: form.emballageClientBranding,
          poidsGrammes: form.emballagePoidsGrammes || undefined
        };
      case CategorieArticle.CONSOMMABLE:
        return {
          configType: 'CONSOMMABLE',
          sousType: form.consommableSousType,
          usage: form.consommableUsage,
          unit: form.consommableUnit,
          quantity: form.consommableQuantity,
          temperatureStockageCelsius: form.consommableTemperatureStockage
        };


      default:
        throw new Error('Catégorie non prise en charge');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.normalizeArticleFormValues();

    if (this.articleForm.invalid) {
      alert(this.i18n.instant('AUTO.LE_FORMULAIRE_EST_INVALIDE_VEUILLEZ_VERIFIER_LES_CHAMPS_OBLIGATO'));
      this.articleForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.articleForm.value;
    const selectedMaterielSupplier = formValue.materielSupplier
      ? this.materielSuppliers.find(f => f.id === formValue.materielSupplier)
      : undefined;

    const articleData: any = {
      nom: formValue.nom,
      categorie: formValue.categorie,
      um: formValue.um,
      stockMinimum: formValue.stockMinimum,
      stockMaximum: formValue.stockMaximum,
      actif: formValue.actif,
      materielSupplier: selectedMaterielSupplier,
      configuration: this.buildConfiguration()
    };

    if (this.isEditMode) {
      this.articleService.updateArticle(this.articleId!, articleData).subscribe({
        next: () => {
          this.router.navigate(['/stock/articles', this.articleId]);
        },
        error: (error) => {
          console.error('Erreur mise à jour:', error);
          this.submitting = false;
          alert(this.i18n.instant('TRANSACTIONS.ERRORS.UPDATE_ERROR'));
        }
      });
    } else {
      this.articleService.createArticle(articleData).subscribe({
        next: (created) => {
          this.router.navigate(['/stock/articles', created.id]);
        },
        error: (error) => {
          console.error('Erreur création:', error);
          this.submitting = false;
          alert(this.i18n.instant('AUTO.ERREUR_DU_SERVEUR') + (error.error?.error || error.message || this.i18n.instant('AUTO.ERREUR_INCONNUE')));
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/articles', this.articleId]);
    } else {
      this.router.navigate(['/stock/articles']);
    }
  }

  get f() {
    return this.articleForm.controls;
  }
}

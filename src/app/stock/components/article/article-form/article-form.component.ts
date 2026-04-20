import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { FournisseurService } from '../../../services/fournisseur.service';
import { Article, CategorieArticle, UniteMesure, ArticleConfig } from '../../../models/article.model';
import { Fournisseur } from '../../../models/fournisseur.model';

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './article-form.component.html',
  styleUrls: ['./article-form.component.scss']
})
export class ArticleFormComponent implements OnInit {
  articleForm: FormGroup;
  categories = Object.values(CategorieArticle);
  unitesMesure = Object.values(UniteMesure);
  fournisseurs: Fournisseur[] = [];
  uniteArticles: Article[] = [];
  loadingUnites = false;
  colisArticles: Article[] = [];
  loadingColis = false;

  isEditMode = false;
  articleId?: string;
  submitted = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private fournisseurService: FournisseurService,
  ) {
    this.articleForm = this.fb.group({
      nom: ['', Validators.required],
      categorie: ['', Validators.required],
      um: ['', Validators.required],
      fournisseur: [null],
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

      consommableType: [''],
      consommableVolumeLitre: [0],
      consommableComposition: [''],
      consommableTemperatureStockage: [0],

      matiereCodeFournisseur: [''],
      matiereDensite: [0],
      matiereOrigine: [''],
      matiereCertifieBio: [false],


      accessoireUsage: [''],
      accessoireNecessiteMontage: [false],
      accessoireGarantieMois: ['']
    });
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.articleId;
    this.loadFournisseurs();
    if (this.isEditMode) {
      this.loadArticle();
    }

    this.articleForm.get('categorie')?.valueChanges.subscribe(cat => {
      if (cat === CategorieArticle.COLIS) {
        this.loadUniteArticles();
      }
      if (cat === CategorieArticle.PALETTE) {
        this.loadColisArticles();
      }
    });
  }

  loadFournisseurs(): void {
    this.fournisseurService.getActiveFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
      },
      error: (error) => console.error('Erreur chargement fournisseurs:', error)
    });
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

  loadArticle(): void {
    this.articleService.getArticleById(this.articleId!).subscribe({
      next: (article) => {
        this.articleForm.patchValue({
          nom: article.nom,
          categorie: article.categorie,
          um: article.um,
          fournisseur: article.fournisseur?.id ?? null,
          stockMinimum: article.stockMinimum,
          stockMaximum: article.stockMaximum,
          actif: article.actif
        });

        if (article.categorie === CategorieArticle.COLIS) {
          this.loadUniteArticles();
        }
        if (article.categorie === CategorieArticle.PALETTE) {
          this.loadColisArticles();
        }

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
                consommableType: (config as any).type,
                consommableVolumeLitre: (config as any).volumeLitre,
                consommableComposition: (config as any).composition,
                consommableTemperatureStockage: (config as any).temperatureStockageCelsius
              });
              break;
            case CategorieArticle.MATIERE_PREMIERE:
              this.articleForm.patchValue({
                matiereCodeFournisseur: (config as any).codeFournisseur,
                matiereDensite: (config as any).densite,
                matiereOrigine: (config as any).origine,
                matiereCertifieBio: (config as any).certifieBio
              });
              break;
            case CategorieArticle.ACCESSOIRE:
              this.articleForm.patchValue({
                accessoireUsage: (config as any).usage,
                accessoireNecessiteMontage: (config as any).necessiteMontage,
                accessoireGarantieMois: (config as any).garantieMois
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
          type: form.consommableType,
          volumeLitre: form.consommableVolumeLitre,
          composition: form.consommableComposition,
          temperatureStockageCelsius: form.consommableTemperatureStockage
        };
      case CategorieArticle.MATIERE_PREMIERE:
        return {
          configType: 'MATIERE_PREMIERE',
          codeFournisseur: form.matiereCodeFournisseur,
          densite: form.matiereDensite,
          origine: form.matiereOrigine,
          certifieBio: form.matiereCertifieBio
        };
      case CategorieArticle.ACCESSOIRE:
        return {
          configType: 'ACCESSOIRE',
          usage: form.accessoireUsage,
          necessiteMontage: form.accessoireNecessiteMontage,
          garantieMois: form.accessoireGarantieMois
        };
      default:
        throw new Error('Catégorie non prise en charge');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.articleForm.invalid) {
      return;
    }

    this.submitting = true;
    const formValue = this.articleForm.value;
    const selectedFournisseur = formValue.fournisseur
      ? this.fournisseurs.find(f => f.id === formValue.fournisseur)
      : undefined;

    const articleData: any = {
      nom: formValue.nom,
      categorie: formValue.categorie,
      um: formValue.um,
      stockMinimum: formValue.stockMinimum,
      stockMaximum: formValue.stockMaximum,
      actif: formValue.actif,
      fournisseur: selectedFournisseur,
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
          alert('Erreur lors de la mise à jour');
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
          alert('Erreur lors de la création');
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

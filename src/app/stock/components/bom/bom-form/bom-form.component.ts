import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { Article, UniteMesure, UniteMesureOption } from '../../../models/article.model';
import { Bom } from "../../../models/Bom";
import { FinalProduct, finalProductDisplayName } from "../../../models/final-product.model";
import { BomService } from "../../../services/BomService";
import { FinalProductService } from "../../../services/final-product.service";
import { ToastService } from '../../../../shared/services/toast.service';
import { MaterialNeedsPreviewComponent } from '../../../../shared/components/material-needs-preview/material-needs-preview.component';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-bom-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule, RouterLink, MaterialNeedsPreviewComponent],
  templateUrl: './bom-form.component.html',
  styleUrls: ['./bom-form.component.scss']
})
export class BomFormComponent implements OnInit {
  bomForm!: FormGroup;
  finalProducts: FinalProduct[] = [];
  articles: Article[] = [];
  unitOptions: UniteMesureOption[] = Object.values(UniteMesure).map((value) => ({ value, label: value }));
  loading = false;
  isSubmitting = false;
  isEditMode = false;
  bomId: string | null = null;
  bom: Bom | null = null;
  private preselectedFinalProductId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService,
    private finalProductService: FinalProductService,
    private articleService: ArticleService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.preselectedFinalProductId = this.route.snapshot.queryParamMap.get('finalProductId')
      || this.route.snapshot.queryParamMap.get('productId');
    this.loadFinalProducts();
    this.loadArticles();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.bomId = id;
      this.loadBom(id);
    } else {
      this.addLine();
    }
  }

  get lines(): FormArray {
    return this.bomForm.get('lines') as FormArray;
  }

  private initForm(): void {
    this.bomForm = this.fb.group({
      finalProductId: ['', Validators.required],
      active: [true],
      lines: this.fb.array([])
    });
  }

  private createLineFormGroup(): FormGroup {
    return this.fb.group({
      articleId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitOfMeasure: [UniteMesure.UNITE, Validators.required]
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  loadFinalProducts(): void {
    this.finalProductService.getActiveFinalProductsByType('NON_VRAC').subscribe({
      next: (data: FinalProduct[]) => {
        this.finalProducts = data;
        if (!this.isEditMode && this.preselectedFinalProductId) {
          const exists = this.finalProducts.some((p) => p.id === this.preselectedFinalProductId);
          if (exists) {
            this.bomForm.patchValue({ finalProductId: this.preselectedFinalProductId });
          }
        }
      },
      error: (err: any) => console.error('Erreur chargement produits', err)
    });
  }

  loadArticles(): void {
    this.articleService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data.filter((a) => a.actif !== false);
      },
      error: (err) => console.error('Erreur chargement articles', err)
    });

    this.articleService.getUnitesMesure().subscribe({
      next: (units) => {
        if (units?.length) {
          this.unitOptions = units;
        }
      },
      error: (err) => console.error('Erreur chargement unités', err)
    });
  }

  loadBom(id: string): void {
    this.loading = true;
    this.bomService.getById(id).subscribe({
      next: (bom) => {
        this.bom = bom;
        this.bomForm.patchValue({
          finalProductId: bom.finalProductId || bom.productId || bom.skuId,
          version: bom.version,
          active: bom.active ?? false
        });
        this.lines.clear();
        if (bom.lines && bom.lines.length > 0) {
          bom.lines.forEach(line => {
            this.lines.push(this.fb.group({
              articleId: [line.articleId, Validators.required],
              quantity: [line.quantity, [Validators.required, Validators.min(0.001)]],
              unitOfMeasure: [line.unitOfMeasure || UniteMesure.UNITE, Validators.required]
            }));
            this.ensureArticleInList(line.articleId, line.articleName);
          });
        } else {
          this.addLine();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.loading = false;
        this.router.navigate(['/stock/boms']);
      }
    });
  }


  onSubmit(): void {
    if (this.lines.length === 0) {
      this.toast.warning('AUTO.AJOUTEZ_AU_MOINS_UNE_LIGNE_A_LA_NOMENCLATURE');
      return;
    }
    if (this.bomForm.invalid) {
      this.bomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.bomForm.getRawValue();
    const payload: Bom = {
      finalProductId: formValue.finalProductId,
      active: !!formValue.active,
      lines: formValue.lines,
      version: this.bom?.version || ''
    };

    if (this.isEditMode && this.bomId) {
      this.bomService.update(this.bomId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('AUTO.NOMENCLATURE_MISE_A_JOUR');
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.isSubmitting = false;
          this.toast.error(err?.error?.error || err?.error?.message || 'TRANSACTIONS.ERRORS.UPDATE_ERROR');
        }
      });
    } else {
      this.bomService.create(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('AUTO.NOMENCLATURE_CREEE');
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur création', err);
          this.isSubmitting = false;
          this.toast.error(err?.error?.error || err?.error?.message || 'TRANSACTIONS.ERRORS.CREATE_ERROR');
        }
      });
    }
  }
  getFilteredArticlesForLine(lineIndex: number): Article[] {
    const currentId = this.lines.at(lineIndex)?.get('articleId')?.value;
    const selectedArticleIds = this.lines.controls
      .map((control, idx) => (idx !== lineIndex ? control.get('articleId')?.value : null))
      .filter((id): id is string => !!id && id !== '');
    return this.articles.filter(
      (article) => article.id === currentId || !selectedArticleIds.includes(article.id!)
    );
  }

  onArticleChange(index: number): void {
    const line = this.lines.at(index);
    const article = this.articles.find((item) => item.id === line.get('articleId')?.value);
    if (article?.um) {
      line.get('unitOfMeasure')?.setValue(article.um);
    }
  }

  private ensureArticleInList(articleId?: string, articleName?: string): void {
    if (!articleId || this.articles.some((a) => a.id === articleId)) {
      return;
    }
    this.articleService.getArticleById(articleId).subscribe({
      next: (article) => {
        if (!this.articles.some((a) => a.id === article.id)) {
          this.articles = [...this.articles, article];
        }
      },
      error: () => {
        if (!this.articles.some((a) => a.id === articleId)) {
          this.articles = [
            ...this.articles,
            {
              id: articleId,
              nom: articleName || `Article ${articleId.substring(0, 8)}`,
              categorie: 'CONSOMMABLE' as Article['categorie'],
              stockMinimum: 0,
              stockMaximum: 0,
              actif: false,
              um: 'UNITE' as Article['um']
            }
          ];
        }
      }
    });
  }


  cancel(): void {
    this.router.navigate(['/stock/boms']);
  }

  finalProductName(finalProduct: FinalProduct): string {
    return finalProductDisplayName(finalProduct);
  }
}

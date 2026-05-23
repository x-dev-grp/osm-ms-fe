import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/article.model';
import { Bom } from "../../../models/Bom";
import { Product, productDisplayName } from "../../../models/sku.model";
import { BomService } from "../../../services/BomService";
import { SKUService } from "../../../services/sku.service";
import { ToastService } from '../../../../shared/services/toast.service';
import { MaterialNeedsPreviewComponent } from '../../../../shared/components/material-needs-preview/material-needs-preview.component';


@Component({
  selector: 'app-bom-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MaterialNeedsPreviewComponent],
  templateUrl: './bom-form.component.html',
  styleUrls: ['./bom-form.component.scss']
})
export class BomFormComponent implements OnInit {
  bomForm!: FormGroup;
  products: Product[] = [];
  articles: Article[] = [];
  loading = false;
  isSubmitting = false;
  isEditMode = false;
  bomId: string | null = null;
  bom: Bom | null = null;
  private preselectedProductId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService,
    private skuService: SKUService,
    private articleService: ArticleService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.preselectedProductId = this.route.snapshot.queryParamMap.get('productId');
    this.loadSkus();
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
      productId: ['', Validators.required],
      active: [true],
      lines: this.fb.array([])
    });
  }

  private createLineFormGroup(): FormGroup {
    return this.fb.group({
      articleId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]]
    });
  }

  addLine(): void {
    this.lines.push(this.createLineFormGroup());
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  loadSkus(): void {
    this.skuService.getActiveProductsByType('NON_VRAC').subscribe({
      next: (data: Product[]) => {
        this.products = data;
        if (!this.isEditMode && this.preselectedProductId) {
          const exists = this.products.some((p) => p.id === this.preselectedProductId);
          if (exists) {
            this.bomForm.patchValue({ productId: this.preselectedProductId });
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
  }

  loadBom(id: string): void {
    this.loading = true;
    this.bomService.getById(id).subscribe({
      next: (bom) => {
        this.bom = bom;
        this.bomForm.patchValue({
          productId: bom.productId || bom.skuId,
          version: bom.version,
          active: bom.active ?? false
        });
        this.lines.clear();
        if (bom.lines && bom.lines.length > 0) {
          bom.lines.forEach(line => {
            this.lines.push(this.fb.group({
              articleId: [line.articleId, Validators.required],
              quantity: [line.quantity, [Validators.required, Validators.min(0.001)]]
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
      this.toast.warning('Ajoutez au moins une ligne à la nomenclature');
      return;
    }
    if (this.bomForm.invalid) {
      this.bomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.bomForm.getRawValue();
    const payload: Bom = {
      productId: formValue.productId,
      active: !!formValue.active,
      lines: formValue.lines,
      version: this.bom?.version || ''
    };

    if (this.isEditMode && this.bomId) {
      this.bomService.update(this.bomId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Nomenclature mise à jour');
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.isSubmitting = false;
          this.toast.error(err?.error?.error || err?.error?.message || 'Erreur lors de la mise à jour');
        }
      });
    } else {
      this.bomService.create(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Nomenclature créée');
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur création', err);
          this.isSubmitting = false;
          this.toast.error(err?.error?.error || err?.error?.message || 'Erreur lors de la création');
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

  productName(product: Product): string {
    return productDisplayName(product);
  }
}

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


@Component({
  selector: 'app-bom-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService,
    private skuService: SKUService,
    private articleService: ArticleService
  ) { }

  ngOnInit(): void {
    this.initForm();
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
      next: (data: Product[]) => this.products = data,
      error: (err: any) => console.error('Erreur chargement produits', err)
    });
  }

  loadArticles(): void {
    this.articleService.getActiveArticles().subscribe({
      next: (data) => this.articles = data,
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
          version: bom.version
        });
        this.lines.clear();
        if (bom.lines && bom.lines.length > 0) {
          bom.lines.forEach(line => {
            this.lines.push(this.fb.group({
              articleId: [line.articleId, Validators.required],
              quantity: [line.quantity, [Validators.required, Validators.min(0.001)]]
            }));
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
    if (this.bomForm.invalid) {
      this.bomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.bomForm.value;

    if (this.isEditMode && this.bomId) {
      this.bomService.update(this.bomId, formValue).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.isSubmitting = false;
          alert('Erreur lors de la mise à jour');
        }
      });
    } else {
      this.bomService.create(formValue).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/stock/boms']);
        },
        error: (err) => {
          console.error('Erreur création', err);
          this.isSubmitting = false;
          alert('Erreur lors de la création');
        }
      });
    }
  }
  getFilteredArticlesForLine(lineIndex: number): Article[] {
    const selectedArticleIds = this.lines.controls
      .map((control, idx) => idx !== lineIndex ? control.get('articleId')?.value : null)
      .filter(id => id && id !== '');
    return this.articles.filter(article => !selectedArticleIds.includes(article.id));
  }


  cancel(): void {
    this.router.navigate(['/stock/boms']);
  }

  productName(product: Product): string {
    return productDisplayName(product);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../services/article.service';
import { FournisseurService } from '../../../services/fournisseur.service';
import { Article, CategorieArticle, UniteMesure } from '../../../models/article.model';
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
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.articleId;
    this.loadFournisseurs();
    if (this.isEditMode) {
      this.loadArticle();
    }
  }

  loadFournisseurs(): void {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
      },
      error: (error) => console.error('Erreur chargement fournisseurs:', error)
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
      },
      error: (error) => {
        console.error('Erreur chargement article:', error);
        this.router.navigate(['/stock/articles']);
      }
    });
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
    const article: Article = {
      nom: formValue.nom,
      categorie: formValue.categorie,
      um: formValue.um,
      stockMinimum: formValue.stockMinimum,
      stockMaximum: formValue.stockMaximum,
      actif: formValue.actif,
      fournisseur: selectedFournisseur,
      //fournisseurId: formValue.fournisseur,
    };

    if (this.isEditMode) {
      this.articleService.updateArticle(this.articleId!, article).subscribe({
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
      this.articleService.createArticle(article).subscribe({
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

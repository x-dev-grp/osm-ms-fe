import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/article.model';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import { ApiResponse } from "../../../../shared/models/api-response";
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-bc-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bc-form.component.html',
  styleUrls: ['./bc-form.component.scss']
})
export class BcFormComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  bcForm: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  articles: Article[] = [];
  filteredArticles: Article[] = [];

  articleSearchTerm: string = '';
  showArticleDropdown = false;
  activeLigneIndex: number = -1;

  constructor(
    private fb: FormBuilder,
    private bonCommandeService: BonCommandeService,
    private articleService: ArticleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bcForm = this.fb.group({
      dateReceptionPrevue: ['', [Validators.required, this.futureDateValidator]],
      lignes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadArticles();
    this.ajouterLigne();
  }

  get lignes(): FormArray {
    return this.bcForm.get('lignes') as FormArray;
  }

  creerLigneForm(): FormGroup {
    return this.fb.group({
      articleId: ['', Validators.required],
      articleNom: [''],
      articleUnite: [''],
      quantiteCommandee: [1, [Validators.required, Validators.min(1)]],
      prixUnitaire: [null, [Validators.min(0)]],
      remarque: ['']
    });
  }

  ajouterLigne(): void {
    this.lignes.push(this.creerLigneForm());
  }

  supprimerLigne(index: number): void {
    this.lignes.removeAt(index);
  }

  loadArticles(): void {
    this.articleService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data;
        this.filteredArticles = data;
      },
      error: (err) => {
        console.error('Erreur chargement articles', err);
        this.error = 'Impossible de charger les articles';
      }
    });
  }

  onArticleSearch(event: any, index: number): void {
    const term = event.target.value.toLowerCase();
    this.articleSearchTerm = term;
    this.activeLigneIndex = index;

    if (term.length > 0) {
      this.filteredArticles = this.articles.filter(article =>
        article.nom.toLowerCase().includes(term) ||
        (article.categorie && article.categorie.toLowerCase().includes(term))
      );
      this.showArticleDropdown = true;
    } else {
      this.filteredArticles = this.articles;
      this.showArticleDropdown = false;
    }
  }

  selectArticle(article: Article, index: number): void {
    const ligneForm = this.lignes.at(index);
    ligneForm.patchValue({
      articleId: article.id,
      articleNom: article.nom,
      articleUnite: article.um || ''
    });
    this.articleSearchTerm = '';
    this.showArticleDropdown = false;
    this.activeLigneIndex = -1;
  }

  prepareFormData(): any {
    const formValue = this.bcForm.value;
    const bonCommande: any = {
      dateReceptionPrevue: formValue.dateReceptionPrevue ? formValue.dateReceptionPrevue + "T00:00:00" : null,
      lignes: formValue.lignes.map((ligne: any) => ({
        articleId: ligne.articleId,
        quantiteCommandee: ligne.quantiteCommandee,
        prixUnitaire: ligne.prixUnitaire || null,
        remarque: ligne.remarque || ''
      }))
    };
    bonCommande.status = StatutBonCommande.EN_ATTENTE;
    return bonCommande;
  }

  onSubmit(): void {
    if (this.bcForm.invalid) {
      this.markFormGroupTouched(this.bcForm);
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    if (this.lignes.length === 0) {
      this.error = 'Ajoutez au moins un article';
      return;
    }

    this.submitting = true;
    this.error = null;
    const formData = this.prepareFormData();

    this.bonCommandeService.createBonCommande(formData).subscribe({
      next: () => {
        this.successMessage = this.i18n.instant('AUTO.BON_DE_COMMANDE_CREE_AVEC_SUCCES');
        setTimeout(() => this.router.navigate(['/stock/bons-commande']), 2000);
      },
      error: (err) => {
        console.error('Erreur création', err);
        this.error = err.error?.message || 'Erreur lors de la création';
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/stock/bons-commande']);
  }

  getQuantiteTotale(): number {
    let total = 0;
    for (let i = 0; i < this.lignes.length; i++) {
      const ligne = this.lignes.at(i);
      const quantite = ligne.get('quantiteCommandee')?.value;
      if (quantite && !isNaN(quantite)) total += Number(quantite);
    }
    return total;
  }

  getTotalPrix(): number {
    let total = 0;
    for (let i = 0; i < this.lignes.length; i++) {
      const ligne = this.lignes.at(i);
      const quantite = ligne.get('quantiteCommandee')?.value;
      const prix = ligne.get('prixUnitaire')?.value;
      if (quantite && prix && !isNaN(quantite) && !isNaN(prix)) total += quantite * prix;
    }
    return total;
  }

  getNombreArticles(): number {
    return this.lignes.length;
  }
  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  get dateReceptionTouched() { return this.bcForm.get('dateReceptionPrevue')?.touched; }
  get dateReceptionErrors() { return this.bcForm.get('dateReceptionPrevue')?.errors; }


  futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      return { futureDate: true };
    }
    return null;
  }
}

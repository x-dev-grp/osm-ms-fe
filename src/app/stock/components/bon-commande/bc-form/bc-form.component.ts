import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BonCommandeService } from '../../../services/bon-commande.service';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/article.model';
import { BonCommande, StatutBonCommande } from '../../../models/bon-commande.model';
import {ApiResponse} from "../../../../shared/models/api-response";


@Component({
  selector: 'app-bc-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bc-form.component.html',
  styleUrls: ['./bc-form.component.scss']
})
export class BcFormComponent implements OnInit {
  bcForm: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  articles: Article[] = [];
  filteredArticles: Article[] = [];

  isEditMode = false;
  bcId: string | null = null;

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
      numeroBC: ['', [Validators.required, Validators.pattern(/^BC-\d{4}-\d{4}$/)]],
      fournisseur: ['', Validators.required],
      dateCreation: [this.getCurrentDate(), Validators.required],
      dateReceptionPrevue: ['', Validators.required],
      remarque: [''],
      lignes: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadArticles();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.bcId = id;
      this.loadBonCommande(id);
    } else {
      this.ajouterLigne();
    }
  }

  get lignes(): FormArray {
    return this.bcForm.get('lignes') as FormArray;
  }

  creerLigneForm(): FormGroup {
    return this.fb.group({
      articleId: ['', Validators.required],
      articleNom: [''],
      articleSku: [''],
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

  loadBonCommande(id: string): void {
    this.loading = true;
    this.bonCommandeService.getBonCommandeById(id).subscribe({
      next: (response: ApiResponse<BonCommande>) => {
        if (response.success && response.data && response.data.length > 0) {
          const bon = response.data[0];

          this.bcForm.patchValue({
            numeroBC: bon.numeroBC,
            fournisseur: bon.fournisseur,
            dateCreation: this.formatDateForInput(new Date()),
            dateReceptionPrevue: bon.dateReceptionPrevue ? this.formatDateForInput(new Date(bon.dateReceptionPrevue)) : '',
            remarque: bon.motifRefus || ''
          });

          // Vider les lignes existantes
          while (this.lignes.length) {
            this.lignes.removeAt(0);
          }

          // Remplir les lignes
          bon.lignes.forEach(ligne => {
            const article = ligne.article || {} as Article;
            this.lignes.push(this.fb.group({
              articleId: [ligne.articleId || article.id, Validators.required],
              articleNom: [article.nom || ''],
              articleSku: [(article as any).sku || ''],
              articleUnite: [article.um || ''],
              quantiteCommandee: [ligne.quantiteCommandee, [Validators.required, Validators.min(1)]],
              prixUnitaire: [ligne.prixUnitaire || null, [Validators.min(0)]],
              remarque: [ligne.remarque || '']
            }));
          });
        } else {
          this.error = response.message || 'Bon de commande non trouvé';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement bon', err);
        this.error = 'Impossible de charger le bon de commande';
        this.loading = false;
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

  onBlur(): void {
    setTimeout(() => {
      this.showArticleDropdown = false;
    }, 200);
  }

  prepareFormData(): any {
    const formValue = this.bcForm.value;

    const bonCommande: any = {
      numeroBC: formValue.numeroBC,
      fournisseur: formValue.fournisseur,
      dateReceptionPrevue: formValue.dateReceptionPrevue,
      lignes: formValue.lignes.map((ligne: any) => ({
        articleId: ligne.articleId,
        quantiteCommandee: ligne.quantiteCommandee,
        prixUnitaire: ligne.prixUnitaire || null,
        remarque: ligne.remarque || ''
      }))
    };

    // Ajouter le statut seulement en création
    if (!this.isEditMode) {
      bonCommande.status = StatutBonCommande.EN_ATTENTE;
    }

    // Ajouter le motif de refus si présent
    if (formValue.remarque) {
      bonCommande.motifRefus = formValue.remarque;
    }

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
    console.log('Données envoyées:', formData);

    if (this.isEditMode && this.bcId) {
      this.bonCommandeService.updateBonCommande(this.bcId, formData).subscribe({
        next: (response: ApiResponse<BonCommande>) => {
          if (response.success) {
            this.successMessage = 'Bon de commande modifié avec succès';
            setTimeout(() => {
              this.router.navigate(['/stock/bons-commande']);
            }, 2000);
          } else {
            this.error = response.message || 'Erreur lors de la modification';
            this.submitting = false;
          }
        },
        error: (err) => {
          console.error('Erreur modification', err);
          this.error = err.error?.message || 'Erreur lors de la modification';
          this.submitting = false;
        }
      });
    } else {
      this.bonCommandeService.createBonCommande(formData).subscribe({
        next: (response: ApiResponse<BonCommande>) => {
          if (response.success) {
            this.successMessage = 'Bon de commande créé avec succès';
            setTimeout(() => {
              this.router.navigate(['/stock/bons-commande']);
            }, 2000);
          } else {
            this.error = response.message || 'Erreur lors de la création';
            this.submitting = false;
          }
        },
        error: (err) => {
          console.error('Erreur création', err);
          this.error = err.error?.message || 'Erreur lors de la création';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/stock/bons-commande']);
  }

  // Méthodes utilitaires
  getQuantiteTotale(): number {
    let total = 0;
    for (let i = 0; i < this.lignes.length; i++) {
      const ligne = this.lignes.at(i);
      const quantite = ligne.get('quantiteCommandee')?.value;
      if (quantite && !isNaN(quantite)) {
        total += Number(quantite);
      }
    }
    return total;
  }

  getTotalPrix(): number {
    let total = 0;
    for (let i = 0; i < this.lignes.length; i++) {
      const ligne = this.lignes.at(i);
      const quantite = ligne.get('quantiteCommandee')?.value;
      const prix = ligne.get('prixUnitaire')?.value;
      if (quantite && prix && !isNaN(quantite) && !isNaN(prix)) {
        total += quantite * prix;
      }
    }
    return total;
  }

  getNombreArticles(): number {
    return this.lignes.length;
  }

  private getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
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

  // Getters pour les erreurs
  get numeroBCTouched() { return this.bcForm.get('numeroBC')?.touched; }
  get numeroBCErrors() { return this.bcForm.get('numeroBC')?.errors; }
  get fournisseurTouched() { return this.bcForm.get('fournisseur')?.touched; }
  get fournisseurErrors() { return this.bcForm.get('fournisseur')?.errors; }
  get dateReceptionTouched() { return this.bcForm.get('dateReceptionPrevue')?.touched; }
  get dateReceptionErrors() { return this.bcForm.get('dateReceptionPrevue')?.errors; }
}

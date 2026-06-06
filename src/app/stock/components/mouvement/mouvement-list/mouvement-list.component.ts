import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MouvementStock, TypeMouvement } from '../../../models/mouvement-stock.model';
import { StockService } from '../../../services/stock.service';

@Component({
  selector: 'app-mouvement-list',
  templateUrl: './mouvement-list.component.html',
  styleUrls: ['./mouvement-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class MouvementListComponent implements OnInit, OnDestroy {
  mouvements: MouvementStock[] = [];
  filteredMouvements: MouvementStock[] = [];

  loading = false;
  error: string | null = null;

  typeFilter = '';
  searchTerm = '';
  showFilters = true;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: TypeMouvement.ENTREE, label: 'Entrees' },
    { value: TypeMouvement.SORTIE, label: 'Sorties' },
    { value: TypeMouvement.AJUSTEMENT, label: 'Ajustements' }
  ];

  TypeMouvement = TypeMouvement;

  constructor(private stockService: StockService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  get hasActiveFilters(): boolean {
    return Boolean(this.typeFilter || this.searchTerm.trim());
  }

  get uniqueArticleCount(): number {
    const articleKeys = new Set(
      this.filteredMouvements
        .map((mouvement) => this.getArticleIdentity(mouvement.article))
        .filter((identity): identity is string => Boolean(identity))
    );

    return articleKeys.size;
  }

  get latestMovementLabel(): string {
    const latest = this.filteredMouvements[0]?.dateMouvement ?? this.mouvements[0]?.dateMouvement;

    if (!latest) {
      return 'Aucun mouvement recent';
    }

    return `Dernier flux ${this.formatDatePart(latest)} a ${this.formatTimePart(latest)}`;
  }

  ngOnInit(): void {
    this.loadMouvements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMouvements(): void {
    this.loading = true;
    this.error = null;

    this.stockService.getAllMouvements().subscribe({
      next: (data) => {
        this.mouvements = data.sort((a, b) => {
          const dateA = a.dateMouvement ? new Date(a.dateMouvement).getTime() : 0;
          const dateB = b.dateMouvement ? new Date(b.dateMouvement).getTime() : 0;
          return dateB - dateA;
        });
        this.applyFilters();
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Erreur lors du chargement des mouvements', err);
        this.error = 'Impossible de charger les mouvements. Veuillez reessayer plus tard.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.mouvements];

    if (this.typeFilter) {
      filtered = filtered.filter((mouvement) => mouvement.typeMouvement === this.typeFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();

      filtered = filtered.filter((mouvement) => {
        if (!mouvement.article) {
          return false;
        }

        const nom = mouvement.article.nom?.toLowerCase() || '';
        const code = this.getArticleCode(mouvement.article).toLowerCase();
        const motif = mouvement.motif?.toLowerCase() || '';

        return nom.includes(term) || code.includes(term) || motif.includes(term);
      });
    }

    this.filteredMouvements = filtered;
  }

  resetFilters(): void {
    this.typeFilter = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  countByType(type: TypeMouvement): number {
    return this.filteredMouvements.filter((mouvement) => mouvement.typeMouvement === type).length;
  }

  getTypeTone(type: string): string {
    switch (type) {
      case TypeMouvement.ENTREE:
        return 'tone-entry';
      case TypeMouvement.SORTIE:
        return 'tone-exit';
      case TypeMouvement.AJUSTEMENT:
        return 'tone-adjustment';
      default:
        return 'tone-neutral';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case TypeMouvement.ENTREE:
        return 'arrow-down';
      case TypeMouvement.SORTIE:
        return 'arrow-up';
      case TypeMouvement.AJUSTEMENT:
        return 'sliders';
      default:
        return 'circle';
    }
  }

  getTypeLabel(type: string): string {
    const option = this.typeOptions.find((currentOption) => currentOption.value === type);
    return option ? option.label : type;
  }

  getTypeCaption(type: string): string {
    switch (type) {
      case TypeMouvement.ENTREE:
        return 'Ajout de stock';
      case TypeMouvement.SORTIE:
        return 'Retrait de stock';
      case TypeMouvement.AJUSTEMENT:
        return 'Correction manuelle';
      default:
        return 'Mouvement';
    }
  }

  getQuantityPrefix(type: string): string {
    switch (type) {
      case TypeMouvement.ENTREE:
        return '+';
      case TypeMouvement.SORTIE:
        return '-';
      case TypeMouvement.AJUSTEMENT:
        return '+/-';
      default:
        return '';
    }
  }

  formatDatePart(date: Date | string | undefined): string {
    const parsedDate = this.parseDate(date);

    if (!parsedDate) {
      return '-';
    }

    return parsedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTimePart(date: Date | string | undefined): string {
    const parsedDate = this.parseDate(date);

    if (!parsedDate) {
      return '--:--';
    }

    return parsedDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getArticleCode(article: any): string {
    if (!article) {
      return '-';
    }

    return article.code || article.sku || article.reference?.code || '-';
  }

  getArticleNom(article: any): string {
    return article?.nom || 'Article inconnu';
  }

  getUniteMesure(article: any): string {
    if (!article) {
      return '';
    }

    return article.um || article.uniteMesure || '';
  }

  trackByMovement(index: number, mouvement: MouvementStock): string {
    return mouvement.id || `${mouvement.articleId || this.getArticleCode(mouvement.article)}-${mouvement.dateMouvement || index}`;
  }

  private parseDate(date: Date | string | undefined): Date | null {
    if (!date) {
      return null;
    }

    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private getArticleIdentity(article: any): string | null {
    if (!article) {
      return null;
    }

    return article.id || article.code || article.sku || article.reference?.code || article.nom || null;
  }
}

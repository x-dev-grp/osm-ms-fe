import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockService } from '../../../services/stock.service';
import { MouvementStock, TypeMouvement } from '../../../models/mouvement-stock.model';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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

  typeFilter: string = '';
  searchTerm: string = '';
  showFilters: boolean = true;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: TypeMouvement.ENTREE, label: 'Entrées' },
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
      error: (err: any) => {
        console.error('Erreur lors du chargement des mouvements', err);
        this.error = 'Impossible de charger les mouvements. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.mouvements];

    if (this.typeFilter) {
      filtered = filtered.filter(mvt => mvt.typeMouvement === this.typeFilter);
    }

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(mvt => {
        if (!mvt.article) return false;
        const nom = mvt.article.nom?.toLowerCase() || '';
        const code = (mvt.article as any).code || (mvt.article as any).sku || '';
        const motif = mvt.motif?.toLowerCase() || '';
        return nom.includes(term) || code.toString().toLowerCase().includes(term) || motif.includes(term);
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

  getTypeClass(type: string): { class: string; icon: string } {
    switch(type) {
      case TypeMouvement.ENTREE:
        return { class: 'success', icon: 'arrow-down' };
      case TypeMouvement.SORTIE:
        return { class: 'danger', icon: 'arrow-up' };
      case TypeMouvement.AJUSTEMENT:
        return { class: 'warning', icon: 'balance-scale' };
      default:
        return { class: 'secondary', icon: 'circle' };
    }
  }

  getTypeLabel(type: string): string {
    const option = this.typeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getArticleCode(article: any): string {
    if (!article) return '-';
    return article.code || article.sku || article.reference?.code || '-';
  }

  getArticleNom(article: any): string {
    return article?.nom || 'Article inconnu';
  }

  getUniteMesure(article: any): string {
    if (!article) return '';
    return article.um || article.uniteMesure || '';
  }
}

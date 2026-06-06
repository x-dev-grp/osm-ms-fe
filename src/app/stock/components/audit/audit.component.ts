import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/AuditService';
import { AuditDto, AuditFilters } from '../../models/AuditDto';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {
  readonly entityBusinessNames: Record<string, string> = {
    ArticleSec: 'Article de stock',
    BOM: 'Nomenclature',
    BomLine: 'Ligne de nomenclature',
    BonCommande: 'Bon de commande',
    Client: 'Client',
    EmplacementStock: 'Emplacement de stock',
    Expedition: 'Expédition',
    ExpeditionArticle: 'Article expédié',
    Fournisseur: 'Fournisseur',
    LabelContent: 'Étiquette',
    LabelSource: 'Source d’étiquette',
    LigneBonCommande: 'Ligne de bon de commande',
    LigneConditionnement: 'Ligne de conditionnement',
    LigneOF: 'Ligne d’ordre de fabrication',
    MouvementStockSec: 'Mouvement de stock',
    OrdreFabrication: 'Ordre de fabrication',
    ProduitFinal: 'Produit fini',
    Projet: 'Projet',
    QCControlPoint: 'Point de contrôle qualité',
    QCPlan: 'Plan de contrôle qualité',
    QCResult: 'Résultat de contrôle qualité',
    ShippingEvent: 'Événement de livraison',
    ShippingInfo: 'Informations de livraison',
    ShippingLine: 'Ligne de livraison',
    StockSec: 'Stock article'
  };

  audits: AuditDto[] = [];
  filteredAudits: AuditDto[] = [];
  paginatedAudits: AuditDto[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50, 100];

  filters: AuditFilters = {
    dateDebut: '',
    dateFin: '',
    typeAction: 'TOUS',
    utilisateur: '',
    entityName: ''
  };

  typeActions = ['TOUS', 'CRÉATION', 'MODIFICATION'];
  entityNames: string[] = [];
  utilisateurs: string[] = [];

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.loadAudit();
  }

  loadAudit(): void {
    this.loading = true;
    this.error = null;

    this.auditService.getAllAudits().subscribe({
      next: (response: AuditDto[]) => {
        this.audits = response.sort((a, b) => {
          const dateA = new Date(a.lastModifiedDate || a.createdDate || 0).getTime();
          const dateB = new Date(b.lastModifiedDate || b.createdDate || 0).getTime();

          return dateB - dateA;
        });

        this.extractData();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement audit:', err);
        this.error = 'Impossible de charger les données d’audit';
        this.loading = false;
      }
    });
  }

  extractData(): void {
    const users = new Set<string>();
    const entities = new Set<string>();

    this.audits.forEach((audit) => {
      if (audit.createdBy) {
        users.add(audit.createdBy);
      }

      if (audit.lastModifiedBy) {
        users.add(audit.lastModifiedBy);
      }

      if (audit.entityName) {
        entities.add(this.getEntityDisplayName(audit.entityName));
      }
    });

    this.utilisateurs = Array.from(users).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    );
    this.entityNames = Array.from(entities).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    );
  }

  applyFilters(): void {
    this.filteredAudits = this.audits.filter((audit) => {
      if (this.filters.dateDebut || this.filters.dateFin) {
        const auditDate = new Date(audit.lastModifiedDate || audit.createdDate);

        if (this.filters.dateDebut) {
          const dateDebut = new Date(this.filters.dateDebut);
          dateDebut.setHours(0, 0, 0, 0);

          if (auditDate < dateDebut) {
            return false;
          }
        }

        if (this.filters.dateFin) {
          const dateFin = new Date(this.filters.dateFin);
          dateFin.setHours(23, 59, 59, 999);

          if (auditDate > dateFin) {
            return false;
          }
        }
      }

      if (this.filters.typeAction !== 'TOUS') {
        const actionType = this.getActionType(audit);

        if (actionType !== this.filters.typeAction) {
          return false;
        }
      }

      if (this.filters.utilisateur) {
        const searchTerm = this.filters.utilisateur.toLowerCase();
        const matchesCreatedBy = audit.createdBy?.toLowerCase().includes(searchTerm);
        const matchesModifiedBy = audit.lastModifiedBy?.toLowerCase().includes(searchTerm);

        if (!matchesCreatedBy && !matchesModifiedBy) {
          return false;
        }
      }

      if (this.filters.entityName) {
        const entitySearchTerm = this.filters.entityName.toLowerCase().trim();
        const technicalEntityName = audit.entityName?.toLowerCase() || '';
        const businessEntityName = this.getEntityDisplayName(audit.entityName).toLowerCase();

        if (
          !technicalEntityName.includes(entitySearchTerm) &&
          !businessEntityName.includes(entitySearchTerm)
        ) {
          return false;
        }
      }

      return true;
    });

    this.filteredAudits.sort((a, b) => {
      const dateA = new Date(a.lastModifiedDate || a.createdDate || 0).getTime();
      const dateB = new Date(b.lastModifiedDate || b.createdDate || 0).getTime();

      return dateB - dateA;
    });

    this.currentPage = 1;
    this.updatePaginatedAudits();
  }

  resetFilters(): void {
    this.filters = {
      dateDebut: '',
      dateFin: '',
      typeAction: 'TOUS',
      utilisateur: '',
      entityName: ''
    };

    this.applyFilters();
  }

  get totalPages(): number {
    return this.filteredAudits.length > 0
      ? Math.ceil(this.filteredAudits.length / this.pageSize)
      : 1;
  }

  get pageStartIndex(): number {
    if (this.filteredAudits.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEndIndex(): number {
    if (this.filteredAudits.length === 0) {
      return 0;
    }

    return Math.min(this.currentPage * this.pageSize, this.filteredAudits.length);
  }

  get visiblePageNumbers(): number[] {
    if (this.filteredAudits.length === 0) {
      return [];
    }

    const maxVisiblePages = 5;
    const halfWindow = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, this.currentPage - halfWindow);
    const maxStartPage = Math.max(1, this.totalPages - maxVisiblePages + 1);
    startPage = Math.min(startPage, maxStartPage);

    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  }

  onPageSizeChange(pageSize: number | string): void {
    this.pageSize = Number(pageSize);
    this.currentPage = 1;
    this.updatePaginatedAudits();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.updatePaginatedAudits();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.updatePaginatedAudits();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.updatePaginatedAudits();
  }

  trackByAudit(index: number, audit: AuditDto): string {
    const activityDate = audit.lastModifiedDate || audit.createdDate || `${index}`;
    return `${audit.entityName || 'audit'}-${audit.id}-${activityDate}`;
  }

  getEntityDisplayName(entityName: string | null | undefined): string {
    if (!entityName) {
      return '-';
    }

    return this.entityBusinessNames[entityName] || entityName;
  }

  getActionType(audit: AuditDto): string {
    if (audit.revisionType === 'ADD') {
      return 'CRÉATION';
    }

    if (audit.revisionType === 'MOD') {
      return 'MODIFICATION';
    }

    if (audit.createdDate === audit.lastModifiedDate) {
      return 'CRÉATION';
    }

    return 'MODIFICATION';
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CRÉATION':
        return 'badge-creation';
      case 'MODIFICATION':
        return 'badge-modification';
      default:
        return '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) {
      return '-';
    }

    const date = new Date(dateStr);

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  private updatePaginatedAudits(): void {
    if (this.filteredAudits.length === 0) {
      this.currentPage = 1;
      this.paginatedAudits = [];
      return;
    }

    this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.paginatedAudits = this.filteredAudits.slice(startIndex, endIndex);
  }
}

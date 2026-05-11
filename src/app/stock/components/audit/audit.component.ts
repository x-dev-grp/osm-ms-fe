import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/AuditService';
import { AuditDto, AuditFilters } from "../../models/AuditDto";

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {

  audits: AuditDto[] = [];
  filteredAudits: AuditDto[] = [];
  loading = false;
  error: string | null = null;

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

        console.log('Audits reçus:', response.length, response);

        // ✅ TRI PAR DATE DÉCROISSANTE (PLUS RÉCENT EN PREMIER)
        this.audits = response.sort((a, b) => {

          const dateA = new Date(
            a.lastModifiedDate || a.createdDate || 0
          ).getTime();

          const dateB = new Date(
            b.lastModifiedDate || b.createdDate || 0
          ).getTime();

          return dateB - dateA;
        });

        this.extractdata();
        this.applyFilters();

        this.loading = false;
      },

      error: (err) => {
        console.error('Erreur chargement audit:', err);

        this.error = 'Impossible de charger les données d\'audit';

        this.loading = false;
      }
    });
  }

  extractdata(): void {

    const users = new Set<string>();
    const entities = new Set<string>();

    this.audits.forEach(audit => {

      if (audit.createdBy) {
        users.add(audit.createdBy);
      }

      if (audit.lastModifiedBy) {
        users.add(audit.lastModifiedBy);
      }

      if (audit.entityName) {
        entities.add(audit.entityName);
      }
    });

    this.utilisateurs = Array.from(users).sort();
    this.entityNames = Array.from(entities).sort();
  }

  applyFilters(): void {

    this.filteredAudits = this.audits.filter(audit => {

      // ✅ FILTRE PAR DATE
      if (this.filters.dateDebut || this.filters.dateFin) {

        const auditDate = new Date(
          audit.lastModifiedDate || audit.createdDate
        );

        // Date début
        if (this.filters.dateDebut) {

          const dateDebut = new Date(this.filters.dateDebut);
          dateDebut.setHours(0, 0, 0, 0);

          if (auditDate < dateDebut) {
            return false;
          }
        }

        // Date fin
        if (this.filters.dateFin) {

          const dateFin = new Date(this.filters.dateFin);
          dateFin.setHours(23, 59, 59, 999);

          if (auditDate > dateFin) {
            return false;
          }
        }
      }

      // ✅ FILTRE TYPE ACTION
      if (this.filters.typeAction !== 'TOUS') {

        const actionType = this.getActionType(audit);

        if (actionType !== this.filters.typeAction) {
          return false;
        }
      }

      // ✅ FILTRE UTILISATEUR
      if (this.filters.utilisateur) {

        const searchTerm =
          this.filters.utilisateur.toLowerCase();

        const matchesCreatedBy =
          audit.createdBy?.toLowerCase().includes(searchTerm);

        const matchesModifiedBy =
          audit.lastModifiedBy?.toLowerCase().includes(searchTerm);

        if (!matchesCreatedBy && !matchesModifiedBy) {
          return false;
        }
      }

      // ✅ FILTRE ENTITÉ
      if (
        this.filters.entityName &&
        !audit.entityName
          ?.toLowerCase()
          .includes(this.filters.entityName.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    // ✅ RE-TRI APRÈS FILTRE
    this.filteredAudits.sort((a, b) => {

      const dateA = new Date(
        a.lastModifiedDate || a.createdDate || 0
      ).getTime();

      const dateB = new Date(
        b.lastModifiedDate || b.createdDate || 0
      ).getTime();

      return dateB - dateA;
    });
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

  // ✅ TYPE ACTION
  getActionType(audit: AuditDto): string {

    if (audit.revisionType === 'ADD') {
      return 'CRÉATION';
    }

    if (audit.revisionType === 'MOD') {
      return 'MODIFICATION';
    }

    // fallback
    if (audit.createdDate === audit.lastModifiedDate) {
      return 'CRÉATION';
    }

    return 'MODIFICATION';
  }

  // ✅ STYLE BADGE
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

  // ✅ FORMAT DATE
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
}

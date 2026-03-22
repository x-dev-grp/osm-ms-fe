import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/AuditService';
import {AuditDto,AuditFilters} from "../../models/AuditDto";


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
        this.audits = response;
        this.extractMetadata();
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


  extractMetadata(): void {
    const users = new Set<string>();
    const entities = new Set<string>();

    this.audits.forEach(audit => {
      if (audit.createdBy) users.add(audit.createdBy);
      if (audit.lastModifiedBy) users.add(audit.lastModifiedBy);
      if (audit.entityName) entities.add(audit.entityName);
    });

    this.utilisateurs = Array.from(users).sort();
    this.entityNames = Array.from(entities).sort();
  }


  applyFilters(): void {
    this.filteredAudits = this.audits.filter(audit => {
      if (this.filters.dateDebut || this.filters.dateFin) {
        const auditDate = new Date(audit.lastModifiedDate || audit.createdDate);

        if (this.filters.dateDebut) {
          const dateDebut = new Date(this.filters.dateDebut);
          dateDebut.setHours(0, 0, 0, 0);
          if (auditDate < dateDebut) return false;
        }

        if (this.filters.dateFin) {
          const dateFin = new Date(this.filters.dateFin);
          dateFin.setHours(23, 59, 59, 999);
          if (auditDate > dateFin) return false;
        }
      }


      if (this.filters.typeAction !== 'TOUS') {
        const isCreation = this.filters.typeAction === 'CRÉATION' &&
          audit.createdDate === audit.lastModifiedDate;
        const isModification = this.filters.typeAction === 'MODIFICATION' &&
          audit.createdDate !== audit.lastModifiedDate;

        if (!isCreation && !isModification) return false;
      }

      if (this.filters.utilisateur) {
        const searchTerm = this.filters.utilisateur.toLowerCase();
        const matchesCreatedBy = audit.createdBy?.toLowerCase().includes(searchTerm);
        const matchesModifiedBy = audit.lastModifiedBy?.toLowerCase().includes(searchTerm);

        if (!matchesCreatedBy && !matchesModifiedBy) return false;
      }

      if (this.filters.entityName && !audit.entityName?.toLowerCase().includes(this.filters.entityName.toLowerCase())) {
        return false;
      }

      return true;
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

  getActionType(audit: AuditDto): string {
    if (audit.createdDate === audit.lastModifiedDate) {
      return 'CRÉATION';
    } else {
      return 'MODIFICATION';
    }
  }

  getActionClass(action: string): string {
    switch(action) {
      case 'CRÉATION': return 'badge-creation';
      case 'MODIFICATION': return 'badge-modification';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
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
// Helper pour Math.min dans le template
  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}

import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AuditService } from '../../services/AuditService';
import { AuditDto } from '../../models/AuditDto';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { AUDIT_DASHBOARD_CONFIG } from './audit-dashboard.config';

interface AuditRow extends AuditDto {
  entityDisplayName: string;
  actionType: string;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    OsmDashboard
  ],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent implements OnInit {
  @ViewChild('dashboard') dashboard?: OsmDashboard;

  private readonly destroyRef = inject(DestroyRef);
  private filteredCountSubscribed = false;

  readonly dashboardConfig: DashboardConfig = AUDIT_DASHBOARD_CONFIG;

  readonly entityBusinessNames: Record<string, string> = {
    ArticleSec: 'Article de stock',
    BOM: 'Nomenclature',
    BomLine: 'Ligne de nomenclature',
    BonCommande: 'Bon de commande',
    Client: 'Client',
    EmplacementStock: 'Emplacement de stock',
    Expedition: 'Expédition',
    ExpeditionArticle: 'Article expédié',
    MaterielSupplier: 'Fournisseur matériel',
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
  filteredCount = 0;
  loading = false;
  error: string | null = null;

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
        this.filteredCount = this.audits.length;
        this.loading = false;
        setTimeout(() => this.setupDashboardIntegration());
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

  private mapRows(audits: AuditDto[]): AuditRow[] {
    return audits.map((audit) => ({
      ...audit,
      entityDisplayName: this.getEntityDisplayName(audit.entityName),
      actionType: this.getActionType(audit)
    }));
  }

  private setupDashboardIntegration(): void {
    this.syncDashboard();
    this.watchFilteredCount();
  }

  private syncDashboard(): void {
    this.dashboard?.setClientSource(this.mapRows(this.audits));
  }

  private watchFilteredCount(): void {
    const store = this.dashboard?._store;
    if (!store || this.filteredCountSubscribed) {
      return;
    }

    this.filteredCountSubscribed = true;
    toObservable(store.data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.filteredCount = data.total;
      });
  }
}

import { Component, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-ligne-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule
  ],
  templateUrl: './ligne-list.component.html',
  styleUrls: ['./ligne-list.component.scss']
})
export class LigneListComponent implements OnInit, AfterViewInit {
  // Data source for Material Table
  dataSource = new MatTableDataSource<LigneConditionnement>([]);

  // State management signals
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  etatFilter = signal<string>('');
  togglingId = signal<string | null>(null);

  displayedColumns: string[] = ['status', 'code', 'nom', 'responsable', 'vitesse', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ligneService: LigneConditionnementService,
    private toast: ToastService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.loadLignes();

    // Custom filter predicate for the data source
    this.dataSource.filterPredicate = (data: LigneConditionnement, filter: string) => {
      const searchObj = JSON.parse(filter);
      const term = searchObj.term.toLowerCase();
      const etat = searchObj.etat;

      const matchesTerm = !term ||
        data.code.toLowerCase().includes(term) ||
        data.nom.toLowerCase().includes(term) ||
        (data.responsable && data.responsable.toLowerCase().includes(term));

      const matchesEtat = !etat || data.etat === etat;

      return !!(matchesTerm && matchesEtat);
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadLignes(): void {
    this.loading.set(true);
    this.ligneService.getAllLignes().subscribe({
      next: (data) => {
        // Sort: Actives first, then by creation date
        const sortedData = (data ?? []).sort((a, b) => {
          if (a.actif !== b.actif) return a.actif ? -1 : 1;
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });

        this.dataSource.data = sortedData;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.toast.error('Impossible de charger les lignes de conditionnement');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      term: this.searchTerm(),
      etat: this.etatFilter()
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onEtatChange(value: string): void {
    this.etatFilter.set(value);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.etatFilter.set('');
    this.applyFilters();
  }

  toggleActif(ligne: LigneConditionnement): void {
    if (!ligne.id) return;

    const isCurrentlyActif = ligne.actif === true;
    const action = isCurrentlyActif ? 'désactiver' : 'activer';

    if (confirm(`Voulez-vous vraiment ${action} la ligne "${ligne.nom}" ?`)) {
      this.togglingId.set(ligne.id);

      const serviceCall = isCurrentlyActif
        ? this.ligneService.desactiverLigne(ligne.id)
        : this.ligneService.activerLigne(ligne.id);

      serviceCall.subscribe({
        next: () => {
          // Update local data
          const newData = this.dataSource.data.map(l =>
            l.id === ligne.id ? { ...l, actif: !isCurrentlyActif } : l
          );
          this.dataSource.data = newData;

          this.toast.success(`Ligne ${ligne.nom} ${isCurrentlyActif ? 'désactivée' : 'activée'}`);
          this.togglingId.set(null);
        },
        error: (err) => {
          console.error('Erreur changement statut:', err);
          this.togglingId.set(null);
        }
      });
    }
  }

  getEtatLabel(etat: Statue): string {
    const labels: Record<string, string> = {
      [Statue.ACTIF]: 'Actif',
      [Statue.INACTIF]: 'Inactif',
      [Statue.EN_MAINTENANCE]: 'Maintenance',
      [Statue.EN_PANNE]: 'Panne'
    };
    return labels[etat] || etat;
  }

  getEtatClass(etat: Statue): string {
    const classes: Record<string, string> = {
      [Statue.ACTIF]: 'bg-green-100 text-green-700',
      [Statue.INACTIF]: 'bg-gray-100 text-gray-700',
      [Statue.EN_MAINTENANCE]: 'bg-amber-100 text-amber-700',
      [Statue.EN_PANNE]: 'bg-red-100 text-red-700'
    };
    return classes[etat] || 'bg-gray-100 text-gray-700';
  }

  totalCount(): number {
    return this.dataSource.data.length;
  }

  activeCount(): number {
    return this.dataSource.data.filter((row) => row.actif).length;
  }

  maintenanceCount(): number {
    return this.dataSource.data.filter((row) => row.etat === Statue.EN_MAINTENANCE).length;
  }
}

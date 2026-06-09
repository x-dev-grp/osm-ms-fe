import { AfterViewInit, Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { OrdreFabrication, StatutOF } from '../../../models/of.model';
import { OFService } from '../../../services/OFService';
import { ToastService } from '../../../../shared/services/toast.service';
import { configureMatTableCreatedDateSort } from '../../../../shared/utils/table-sort.util';

@Component({
  selector: 'app-of-list',
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
    MatMenuModule
  ],
  templateUrl: './of-list.component.html',
  styleUrls: ['./of-list.component.scss']
})
export class OFListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<OrdreFabrication>([]);

  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  statusFilter = signal<string>('');
  searching = signal<boolean>(false);

  readonly statusOptions = Object.values(StatutOF);
  displayedColumns: string[] = ['status', 'code', 'product', 'quantiteCible', 'quantities', 'dateDebutPrevue', 'createdDate', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly ofService: OFService,
    private readonly toast: ToastService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOFs();

    configureMatTableCreatedDateSort(this.dataSource);

    this.dataSource.filterPredicate = (data: OrdreFabrication, filter: string) => {
      const searchObj = JSON.parse(filter) as { term: string; status: string };
      const term = searchObj.term.toLowerCase();
      const status = searchObj.status;

      const productLabel = this.productLabel(data).toLowerCase();
      const matchesTerm = !term ||
        (data.code || '').toLowerCase().includes(term) ||
        productLabel.includes(term) ||
        (data.ligneNom || '').toLowerCase().includes(term) ||
        (data.publicCode || '').toLowerCase().includes(term);

      const matchesStatus = !status || data.statut === status;

      return matchesTerm && matchesStatus;
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadOFs(): void {
    this.loading.set(true);

    this.ofService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement OF', err);
        this.toast.error('Impossible de charger les ordres de fabrication');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      term: this.searchTerm(),
      status: this.statusFilter()
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilters();
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.applyFilters();
  }

  searchByCode(): void {
    const code = this.searchTerm().trim();
    if (!code || this.searching()) {
      return;
    }

    this.searching.set(true);
    this.ofService.getByCode(code).subscribe({
      next: (of) => {
        this.searching.set(false);
        if (of?.id) {
          this.router.navigate(['/of', of.id]);
        } else {
          this.toast.warning('Aucun OF trouvé pour ce code');
        }
      },
      error: () => {
        this.searching.set(false);
        this.toast.warning('Aucun OF trouvé pour ce code');
      }
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchByCode();
    }
  }

  viewOF(of: OrdreFabrication): void {
    if (of.id) {
      this.router.navigate(['/of', of.id]);
    }
  }

  goToProduction(of: OrdreFabrication): void {
    this.router.navigate(['/of/production'], {
      queryParams: { ofId: of.id, ofCode: of.code }
    });
  }

  goToQualityControl(of: OrdreFabrication): void {
    this.router.navigate(['/of/qualite/points'], {
      queryParams: { ofId: of.id, ofCode: of.code }
    });
  }

  productLabel(of: OrdreFabrication): string {
    return of.productName || of.skuCode || of.productId || of.skuId || '-';
  }

  getStatusLabel(statut: StatutOF): string {
    const labels: Record<StatutOF, string> = {
      [StatutOF.PLANIFIE]: 'Planifié',
      [StatutOF.EN_COURS]: 'En cours',
      [StatutOF.EN_PAUSE]: 'En pause',
      [StatutOF.TERMINE]: 'Terminé',
      [StatutOF.CLOTURE]: 'Clôturé',
      [StatutOF.EN_ATTENTE]: 'En attente',
      [StatutOF.ANNULE]: 'Annulé'
    };
    return labels[statut] || statut;
  }

  getStatusClass(statut: StatutOF): string {
    const classes: Record<StatutOF, string> = {
      [StatutOF.PLANIFIE]: 'bg-blue-100 text-blue-700',
      [StatutOF.EN_COURS]: 'bg-green-100 text-green-700',
      [StatutOF.EN_PAUSE]: 'bg-amber-100 text-amber-700',
      [StatutOF.TERMINE]: 'bg-green-100 text-green-700',
      [StatutOF.CLOTURE]: 'bg-green-100 text-green-700',
      [StatutOF.EN_ATTENTE]: 'bg-gray-100 text-gray-700',
      [StatutOF.ANNULE]: 'bg-red-100 text-red-700'
    };
    return classes[statut] || 'bg-gray-100 text-gray-700';
  }

  totalCount(): number {
    return this.dataSource.data.length;
  }

  inProgressCount(): number {
    return this.dataSource.data.filter((row) => row.statut === StatutOF.EN_COURS).length;
  }

  completedCount(): number {
    return this.dataSource.data.filter((row) =>
      row.statut === StatutOF.TERMINE || row.statut === StatutOF.CLOTURE
    ).length;
  }
}

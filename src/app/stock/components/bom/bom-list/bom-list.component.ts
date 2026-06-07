import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Bom } from '../../../models/Bom';
import { BomService } from '../../../services/BomService';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bom-list.component.html',
  styleUrls: ['./bom-list.component.scss']
})
export class BomListComponent implements OnInit {
  boms: Bom[] = [];
  displayedBoms: Bom[] = [];
  loading = true;
  searchTerm = '';
  filterActive: '' | 'active' | 'inactive' = '';
  activatingId: string | null = null;
  activeDropdown: string | null = null;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];

  constructor(
    private bomService: BomService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoms();
  }

  loadBoms(): void {
    this.bomService.getAll().subscribe({
      next: (data) => {
        this.boms = data.sort((a, b) => {
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des nomenclatures', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const search = this.searchTerm.trim().toLowerCase();
    this.displayedBoms = this.boms.filter((bom) => {
      const searchableText = `${bom.productName || ''} ${bom.skuCode || ''} ${bom.version || ''}`.toLowerCase();
      const matchesSearch = search.length === 0 || searchableText.includes(search);

      if (this.filterActive === 'active') {
        return !!bom.active && matchesSearch;
      }
      if (this.filterActive === 'inactive') {
        return !bom.active && matchesSearch;
      }
      return matchesSearch;
    });
    this.currentPage = 1;
  }

  get pagedBoms(): Bom[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayedBoms.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayedBoms.length / this.pageSize));
  }

  get paginationStart(): number {
    return this.displayedBoms.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.displayedBoms.length);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterActive = '';
    this.applyFilter();
  }

  goToDetail(id: string | undefined, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a')) {
      return;
    }
    if (id) {
      this.router.navigate(['/stock/boms', id]);
    }
  }

  toggleDropdown(id: string | undefined, event: Event): void {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === id ? null : id ?? null;
  }

  activateBom(bom: Bom, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!bom.id || bom.active) {
      return;
    }

    this.activatingId = bom.id;
    this.bomService.activate(bom.id).subscribe({
      next: () => {
        this.activatingId = null;
        this.activeDropdown = null;
        this.toast.success(`Nomenclature ${bom.version} activee`);
        this.loadBoms();
      },
      error: (err) => {
        this.activatingId = null;
        this.toast.error(err?.error?.error || err?.error?.message || 'Impossible d\'activer la nomenclature');
      }
    });
  }

  deleteBom(id: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (confirm('Etes-vous sur de vouloir supprimer cette nomenclature ?')) {
      this.bomService.delete(id).subscribe({
        next: () => {
          this.activeDropdown = null;
          this.toast.success('Nomenclature supprimee');
          this.loadBoms();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la nomenclature', err);
          this.toast.error(err?.error?.error || err?.error?.message || 'Impossible de supprimer cette nomenclature');
        }
      });
    }
  }
}

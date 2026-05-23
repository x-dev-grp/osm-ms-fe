import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Bom } from "../../../models/Bom";
import { BomService } from "../../../services/BomService";
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
  filterActive: '' | 'active' | 'inactive' = '';

  activatingId: string | null = null;

  constructor(
    private bomService: BomService,
    private toast: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBoms();
  }

  loadBoms(): void {
    this.bomService.getAll().subscribe({
      next: (data) => {
        // Tri par createdDate décroissant (ou par id si pas de date)
        this.boms = data.sort((a, b) => {
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.displayedBoms = this.boms.filter((bom) => {
      if (this.filterActive === 'active') {
        return !!bom.active;
      }
      if (this.filterActive === 'inactive') {
        return !bom.active;
      }
      return true;
    });
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
        this.toast.success(`Nomenclature ${bom.version} activée`);
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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette nomenclature ?')) {
      this.bomService.delete(id).subscribe({
        next: () => {
          this.toast.success('Nomenclature supprimée');
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

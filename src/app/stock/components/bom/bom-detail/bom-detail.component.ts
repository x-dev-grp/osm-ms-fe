import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BomService } from "../../../services/BomService";
import { Bom } from "../../../models/Bom";
import { ToastService } from '../../../../shared/services/toast.service';
import { MaterialNeedsPreviewComponent } from '../../../../shared/components/material-needs-preview/material-needs-preview.component';


@Component({
  selector: 'app-bom-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MaterialNeedsPreviewComponent],
  templateUrl: './bom-detail.component.html',
  styleUrls: ['./bom-detail.component.scss']
})
export class BomDetailComponent implements OnInit {
  bom: Bom | null = null;
  loading = true;
  activating = false;
  previewQuantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/stock/boms']);
      return;
    }
    this.loadBom(id);
  }

  loadBom(id: string): void {
    this.bomService.getById(id).subscribe({
      next: (data) => {
        this.bom = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.loading = false;
        this.router.navigate(['/stock/boms']);
      }
    });
  }

  activateBom(): void {
    if (!this.bom?.id || this.bom.active) {
      return;
    }
    this.activating = true;
    this.bomService.activate(this.bom.id).subscribe({
      next: (updated) => {
        this.bom = updated;
        this.activating = false;
        this.toast.success('Nomenclature définie comme active');
      },
      error: (err) => {
        this.activating = false;
        this.toast.error(err?.error?.error || err?.error?.message || 'Impossible d\'activer la nomenclature');
      }
    });
  }
}

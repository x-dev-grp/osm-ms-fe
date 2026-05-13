import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { LabelContentDto, LabelContentStatus } from '../../models/label.model';
import { LabelService } from '../../services/label.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-label-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss']
})
export class LabelListComponent implements OnInit {
  dataSource = new MatTableDataSource<LabelContentDto>([]);
  allLabels: LabelContentDto[] = [];
  availableCertifications: Certification[] = [];
  searchTerm = '';

  displayedColumns: string[] = ['lotNumber', 'legalDenomination', 'netQuantity', 'certifications', 'packagingDate', 'labelCategory', 'status', 'actions'];

  loading = false;
  changingStatusId: string | null = null;

  openedActionMenuId: string | null = null;
  openedStatusMenuId: string | null = null;

  errorMessage = '';
  successMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly labelService: LabelService,
    private readonly certificationService: CertificationService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.loadLabels();

    this.dataSource.filterPredicate = (data: LabelContentDto, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (data.lotNumber?.toLowerCase().includes(searchStr) ||
        data.legalDenomination?.toLowerCase().includes(searchStr) ||
        data.publicCode?.toLowerCase().includes(searchStr) ||
        this.statusLabel(data.status).toLowerCase().includes(searchStr));
    };
  }

  loadLabels(): void {
    this.loading = true;
    this.changingStatusId = null;
    this.clearMessages();
    this.loading = true;

    forkJoin({
      labels: this.labelService.getAll(),
      certs: this.certificationService.getAll()
    }).subscribe({
      next: ({ labels, certs }) => {
        this.availableCertifications = certs || [];
        this.allLabels = labels ?? [];
        this.dataSource.data = this.allLabels;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Impossible de charger la liste des etiquettes.'
        );
      }
    });
  }

  getCertInfo(name: string): Certification | undefined {
    return this.availableCertifications.find(c => c.name === name);
  }

  createNewLabel(): void {
    void this.router.navigate(['/labels/new']);
  }

  toggleActionMenu(label: LabelContentDto, event: Event): void {
    event.stopPropagation();

    if (!label.id) {
      return;
    }

    this.openedActionMenuId = this.openedActionMenuId === label.id ? null : label.id;
    this.openedStatusMenuId = null;
  }

  toggleStatusMenu(label: LabelContentDto, event: Event): void {
    event.stopPropagation();

    if (!label.id) {
      return;
    }

    this.openedStatusMenuId = this.openedStatusMenuId === label.id ? null : label.id;
  }

  closeMenus(): void {
    this.openedActionMenuId = null;
    this.openedStatusMenuId = null;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dataSource.filter = input.value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  canFinalize(label: LabelContentDto): boolean {
    return label.status !== 'FINALIZED' && label.status !== 'EXPORTED_JSON';
  }

  onDelete(label: LabelContentDto): void {
    if (!label.id) return;

    let message = 'Êtes-vous sûr de vouloir supprimer cette étiquette ?';
    if (label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      message = 'ATTENTION : Cette étiquette est FINALISÉE. Sa suppression est fortement déconseillée pour la traçabilité. Voulez-vous vraiment continuer ?';
    }

    if (!confirm(message)) return;

    this.loading = true;
    this.labelService.delete(label.id).subscribe({
      next: () => {
        this.allLabels = this.allLabels.filter(l => l.id !== label.id);
        this.dataSource.data = this.allLabels;
        this.successMessage = 'Étiquette supprimée avec succès.';
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de la suppression.');
      }
    });
  }

  editLabel(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    void this.router.navigate(['/labels', label.id, 'edit']);
  }

  viewDetails(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    void this.router.navigate(['/labels', label.id]);
  }

  changeStatus(label: LabelContentDto, status: 'DRAFT' | 'VALIDATED' | 'FINALIZED'): void {
    if (!label.id) {
      return;
    }

    if (status === 'DRAFT') {
      this.markAsDraft(label);
      return;
    }



    if (status === 'FINALIZED') {
      this.finalizeLabel(label);
    }
  }

  markAsDraft(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    if (label.status === 'DRAFT') {
      return;
    }

    if (label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      this.errorMessage = 'Une etiquette finalisee ou exportee ne peut pas etre remise en brouillon.';
      this.closeMenus();
      return;
    }

    this.changingStatusId = label.id;
    this.clearMessages();
    this.closeMenus();

    this.labelService.markAsDraft(label.id).subscribe({
      next: (updatedLabel) => {
        this.changingStatusId = null;
        this.replaceLabel(updatedLabel);
        this.successMessage = 'Statut change en brouillon avec succes.';
      },
      error: (error) => {
        this.changingStatusId = null;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors du changement vers brouillon.'
        );
      }
    });
  }



  finalizeLabel(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    if (label.status === 'FINALIZED' || label.status === 'EXPORTED_JSON') {
      return;
    }

    this.changingStatusId = label.id;
    this.clearMessages();
    this.closeMenus();

    this.labelService.finalize(label.id).subscribe({
      next: (updatedLabel) => {
        this.changingStatusId = null;
        this.replaceLabel(updatedLabel);
        this.successMessage = 'Etiquette finalisee avec succes.';
      },
      error: (error) => {
        this.changingStatusId = null;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de la finalisation de l etiquette.'
        );
      }
    });
  }

  exportLabel(label: LabelContentDto): void {
    if (!label.id) {
      return;
    }

    this.labelService.export(label.id).subscribe({
      next: (labelExport) => {
        this.downloadJson(
          labelExport.payloadJson ?? '{}',
          String(labelExport.lotNumber || labelExport.labelId || label.id || 'etiquette')
        );

        // Update local status if it was finalized
        if (label.status === 'FINALIZED') {
          label.status = 'EXPORTED_JSON';
          this.replaceLabel(label);
        }

        this.successMessage = 'JSON etiquette exporte avec succes.';
      },
      error: (error) => {
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de l export de l etiquette.'
        );
      }
    });
  }

  private downloadJson(payloadJson: string, name: string): void {
    const safeName = name || 'etiquette';
    const fileName = `label-${safeName}.json`;

    const blob = new Blob([payloadJson || '{}'], {
      type: 'application/json;charset=utf-8'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(url);
  }

  statusLabel(status: LabelContentStatus | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'VALIDATED':
        return 'Validee';
      case 'FINALIZED':
        return 'Finalisee';
      case 'EXPORTED_JSON':
        return 'Exportee JSON';
      default:
        return '-';
    }
  }

  statusClass(status: LabelContentStatus | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'VALIDATED':
        return 'validated';
      case 'FINALIZED':
        return 'finalized';
      case 'EXPORTED_JSON':
        return 'exported';
      default:
        return 'unknown';
    }
  }

  trackById(index: number, label: LabelContentDto): string {
    return label.id ?? `${index}`;
  }

  private replaceLabel(updatedLabel: LabelContentDto): void {
    this.allLabels = this.allLabels.map((item) =>
      item.id === updatedLabel.id ? updatedLabel : item
    );
    this.dataSource.data = this.allLabels;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    const genericMessage = (error as { message?: string })?.message;

    return apiMessage || genericMessage || fallback;
  }
}

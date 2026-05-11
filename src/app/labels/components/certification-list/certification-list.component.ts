import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';
import { CertificationFormComponent } from '../certification-form/certification-form.component';

@Component({
  selector: 'app-certification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <div class="title-section">
          <h1>Gestion des Certifications</h1>
          <p class="subtitle">Configuration des labels et sceaux de qualité</p>
        </div>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Nouvelle Certification
        </button>
      </header>

      <div class="filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Rechercher une certification</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Nom, code, organisme..." #input>
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="table-container shadow-premium">
        <div class="loading-overlay" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Logo Column -->
          <ng-container matColumnDef="logo">
            <th mat-header-cell *matHeaderCellDef> Logo </th>
            <td mat-cell *matCellDef="let row">
              <div class="logo-preview" [style.background-image]="row.logoData ? 'url(data:' + row.logoContentType + ';base64,' + row.logoData + ')' : ''">
                <mat-icon *ngIf="!row.logoData">verified</mat-icon>
              </div>
            </td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nom </th>
            <td mat-cell *matCellDef="let row"> 
              <div class="name-cell">
                <span class="name-text">{{row.name}}</span>
                <span class="code-badge">{{row.code}}</span>
              </div>
            </td>
          </ng-container>

          <!-- Category Column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef> Catégorie </th>
            <td mat-cell *matCellDef="let row"> {{row.category}} </td>
          </ng-container>

          <!-- Body Column -->
          <ng-container matColumnDef="issuingBody">
            <th mat-header-cell *matHeaderCellDef> Organisme </th>
            <td mat-cell *matCellDef="let row"> {{row.issuingBody}} </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Statut </th>
            <td mat-cell *matCellDef="let row">
              <span class="status-pill" [class.active]="row.isActive">
                {{row.isActive ? 'Actif' : 'Inactif'}}
              </span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary" (click)="openForm(row)" matTooltip="Modifier">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteCert(row)" matTooltip="Supprimer">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="6">Aucune certification trouvée pour "{{input.value}}"</td>
          </tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Sélectionner la page"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      h1 { margin: 0; font-weight: 900; color: #1c1917; }
      .subtitle { color: #78716c; margin-top: 4px; }
    }
    .filters {
      margin-bottom: 24px;
      .search-field { width: 100%; max-width: 400px; }
    }
    .table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      border: 1px solid #e7e5e4;
    }
    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    table { width: 100%; }
    .logo-preview {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      background-color: #f5f5f4;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #a8a29e;
    }
    .name-cell {
      display: flex;
      flex-direction: column;
      .name-text { font-weight: 600; color: #1c1917; }
      .code-badge { font-size: 10px; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px; }
    }
    .status-pill {
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 11px;
      font-weight: 700;
      background: #f5f5f4;
      color: #78716c;
      &.active { background: #dcfce7; color: #166534; }
    }
    .shadow-premium {
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
  `]
})
export class CertificationListComponent implements OnInit {
  displayedColumns: string[] = ['logo', 'name', 'category', 'issuingBody', 'status', 'actions'];
  dataSource = new MatTableDataSource<Certification>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private certService: CertificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCertifications();
  }

  loadCertifications(): void {
    this.loading = true;
    this.certService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openForm(cert?: Certification): void {
    const dialogRef = this.dialog.open(CertificationFormComponent, {
      width: '600px',
      data: cert || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          this.certService.update(result).subscribe(() => this.loadCertifications());
        } else {
          this.certService.create(result).subscribe(() => this.loadCertifications());
        }
      }
    });
  }

  deleteCert(cert: Certification): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la certification "${cert.name}" ?`)) {
      this.loading = true;
      this.certService.delete(cert.id!).subscribe({
        next: () => this.loadCertifications(),
        error: () => this.loading = false
      });
    }
  }
}

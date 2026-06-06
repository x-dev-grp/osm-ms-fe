import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule } from '@angular/material/sort';
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
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatSortModule,
    RouterModule
  ],
  templateUrl: './certification-list.component.html',
  styleUrls: ['./certification-list.component.scss']
})
export class CertificationListComponent implements OnInit {
  displayedColumns: string[] = ['certification', 'category', 'issuingBody', 'status', 'actions'];
  dataSource = new MatTableDataSource<Certification>([]);
  originalData: Certification[] = [];
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
        // Sort by status (Active first) AND THEN by createdDate descending (newest first)
        const sortedData = data.sort((a, b) => {
          // 1. Sort by status: Active (true) before Inactive (false)
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }
          
          // 2. Sort by date: Newest first
          const dateA = new Date(a.createdDate || 0).getTime();
          const dateB = new Date(b.createdDate || 0).getTime();
          return dateB - dateA;
        });
        
        this.dataSource.data = sortedData;
        this.originalData = [...sortedData];
        this.dataSource.paginator = this.paginator;
        
        // Custom filter predicate to search in multiple fields
        this.dataSource.filterPredicate = (data: Certification, filter: string) => {
          const searchStr = `${data.name} ${data.code} ${data.issuingBody} ${data.category}`.toLowerCase();
          return searchStr.includes(filter.toLowerCase());
        };

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

  filterByStatus(isActive: boolean): void {
    this.dataSource.data = this.originalData.filter(c => c.isActive === isActive);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  filterByCategory(category: string): void {
    this.dataSource.data = this.originalData.filter(c => c.category === category);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  resetFilters(): void {
    this.dataSource.data = [...this.originalData];
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
}

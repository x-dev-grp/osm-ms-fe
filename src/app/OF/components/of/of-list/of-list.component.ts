import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { OrdreFabrication, StatutOF } from '../../../models/of.model';
import { OFService } from "../../../services/OFService";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'app-of-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem
  ],
  templateUrl: './of-list.component.html',
  styleUrls: ['./of-list.component.scss']
})
export class OFListComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  loading = true;
  searchCode = '';
  searching = false;
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private ofService: OFService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOFs();
  }

  loadOFs(): void {
    this.ofService.getAll().subscribe({
      next: (data) => {

        this.ofs = data
          .slice()
          .sort((a, b) => {
            const dateA = new Date(a.createdDate || 0).getTime();
            const dateB = new Date(b.createdDate || 0).getTime();
            return dateB - dateA; // plus récent en premier
          });
        this.currentPage = 1;

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement OF', err);
        this.loading = false;
      }
    });
  }

  get pagedOfs(): OrdreFabrication[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.ofs.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.ofs.length / this.pageSize));
  }

  get paginationStart(): number {
    return this.ofs.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.ofs.length);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  getStatusClass(statut: StatutOF): string {
    return statut.toLowerCase();
  }

  searchByCode(): void {
    const code = this.searchCode.trim();
    if (!code || this.searching) {
      return;
    }

    this.searching = true;
    this.ofService.getByCode(code).subscribe({
      next: (of) => {
        this.searching = false;
        if (of?.id) {
          this.router.navigate(['/of', of.id]);
        }
      },
      error: () => {
        this.searching = false;
        alert('Aucun OF trouve pour ce code');
      }
    });
  }
  viewOF(of: OrdreFabrication): void {
    this.router.navigate(['/of', of.id]);
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
}

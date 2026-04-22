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
    MatButtonModule
  ],
  templateUrl: './of-list.component.html',
  styleUrls: ['./of-list.component.scss']
})
export class OFListComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  loading = true;
  searchCode = '';
  searching = false;

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

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement OF', err);
        this.loading = false;
      }
    });
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
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Bom } from "../../../models/Bom";
import { BomService } from "../../../services/BomService";


@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bom-list.component.html',
  styleUrls: ['./bom-list.component.scss']
})
export class BomListComponent implements OnInit {
  boms: Bom[] = [];
  loading = true;

  constructor(private bomService: BomService) { }

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.loading = false;
      }
    });
  }
}

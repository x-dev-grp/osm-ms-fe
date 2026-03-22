import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdreFabrication, StatutOF } from '../../../models/of.model';
import { OFService } from "../../../services/OFService";

@Component({
  selector: 'app-of-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './of-list.component.html',
  styleUrls: ['./of-list.component.scss']
})
export class OFListComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  loading = true;

  constructor(private ofService: OFService) {}

  ngOnInit(): void {
    this.loadOFs();
  }

  loadOFs(): void {
    this.ofService.getAll().subscribe({
      next: (data) => {
        this.ofs = data;
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
}

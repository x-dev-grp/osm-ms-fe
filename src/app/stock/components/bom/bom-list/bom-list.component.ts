import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {Bom} from "../../../models/Bom";
import {BomService} from "../../../services/BomService";


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

  constructor(private bomService: BomService) {}

  ngOnInit(): void {
    this.loadBoms();
  }

  loadBoms(): void {
    this.bomService.getAll().subscribe({
      next: (data) => {
        this.boms = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement BOM', err);
        this.loading = false;
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BomService } from "../../../services/BomService";
import { Bom } from "../../../models/Bom";


@Component({
  selector: 'app-bom-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bom-detail.component.html',
  styleUrls: ['./bom-detail.component.scss']
})
export class BomDetailComponent implements OnInit {
  bom: Bom | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bomService: BomService
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
}

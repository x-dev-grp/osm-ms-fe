import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator } from '@angular/material/paginator';
import { MatDivider } from '@angular/material/divider';

import { ClientService } from "../../../services/ClientService";
import { Client } from "../../../models/Client";

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatPaginator,
    MatDivider
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientListComponent {
  readonly displayedColumns: string[] = [
    'nom',
    'email',
    'telephone',
    'type',
    'actions'
  ];

  readonly loading = signal(false);
  readonly rows = signal<Client[]>([]);
  readonly totalElements = signal(0);

  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly destroyRef = inject(DestroyRef);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.clientService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const rows = data ?? [];
          this.rows.set(rows);
          this.totalElements.set(rows.length);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.rows.set([]);
          this.totalElements.set(0);
          this.loading.set(false);
        }
      });
  }

  onCreate(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  onEdit(row: Client): void {
    if (!row?.id) return;
    this.router.navigate([row.id], { relativeTo: this.route });
  }

  onDelete(row: Client): void {
    if (!row?.id) return;

    if (!confirm(`Supprimer le client "${row.nom}" ?`)) {
      return;
    }

    this.loading.set(true);

    this.clientService.delete(row.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  typeLabel(type?: string): string {
    if (type === 'BUYER') return 'Acheteur';
    if (type === 'BRAND_OWNER') return 'Proprietaire marque';
    return type ?? '-';
  }

  onPageChange(event: { pageSize: number }): void {
    this.pageSize = event.pageSize;
  }
}


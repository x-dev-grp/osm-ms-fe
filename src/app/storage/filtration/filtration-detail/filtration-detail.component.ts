import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';

@Component({
  selector: 'app-filtration-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipListbox,
    MatChip,
    TranslateModule
  ],
  templateUrl: './filtration-detail.component.html',
  styleUrls: ['./filtration-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltrationDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(FiltrationApiService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  operation = signal<FiltrationOperation | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('Identifiant absent.');
      return;
    }

    this.api
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (op) => {
          this.operation.set(op);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Impossible de charger l’opération.');
        }
      });
  }

  backToList(): void {
    void this.router.navigate(['storage', 'oil-filtering']);
  }

  editOperation(): void {
    const op = this.operation();
    if (!op?.operationId) {
      return;
    }
    void this.router.navigate(['storage', 'oil-filtering', op.operationId, 'edit']);
  }

  openTraceability(): void {
    const op = this.operation();
    if (!op?.operationId) {
      return;
    }
    void this.router.navigate(['storage', 'oil-filtering', op.operationId, 'traceability']);
  }

  openQualityControl(): void {
    const op = this.operation();
    if (!op?.operationId || String(op.status) !== 'COMPLETED') {
      return;
    }
    void this.router.navigate(['storage', 'oil-filtering', op.operationId, 'quality']);
  }
}

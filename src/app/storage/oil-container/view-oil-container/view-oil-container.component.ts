import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { OilContainerService } from '../../../shared/services/oil-Container.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { OilContainer } from 'src/app/shared/models/oil-container';

@Component({
  selector: 'app-view-oil-container',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatChipsModule, TranslateModule],
  templateUrl: './view-oil-container.component.html',
  styleUrls: ['./view-oil-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewOilContainerComponent implements OnInit {
  error: string | null = null;
  data: OilContainer | null = null;
  loading: boolean = true;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OilContainerService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadContainer();
  }

  private loadContainer(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.fail('Missing container id');
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = null;
    this.data = null;
    this.cdr.markForCheck();

    this.service.getOilContainer(id).subscribe({
      next: (res: any) => {
        this.data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load oil container', err);
        this.toast.error('Failed to load oil container');
        this.fail('Failed to load oil container');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  edit(): void {
    if (!this.data?.id) return;
    this.router.navigate(['../edit', this.data.id], { relativeTo: this.route });
  }

  retry(): void {
    this.loadContainer();
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  fmtMoney(v?: number): string {
    if (v == null || !Number.isFinite(v)) return '-';
    try {
      return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        maximumFractionDigits: 3
      }).format(v);
    } catch {
      return `${v.toFixed(3)} TND`;
    }
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    try {
      return new Intl.DateTimeFormat('fr-TN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(date));
    } catch {
      return date;
    }
  }

  private fail(message: string) {
    this.error = message;
  }
}

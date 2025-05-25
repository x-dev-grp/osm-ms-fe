import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { SharedModule } from '../../../demo/shared/shared.module';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';

@Component({
  selector: 'app-view-storage',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    SharedModule
  ],
  templateUrl: './view-storage.component.html',
  styleUrls: ['./view-storage.component.scss']
})
export class ViewStorageComponent implements OnInit {
  loading = false;
  storageUnit: StorageUnitDto | null = null;

  constructor(
    private storageService: StorageUnitDtoService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStorageUnit();
  }

  private loadStorageUnit(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.snackBar.open('Invalid storage unit ID', 'Close', { duration: 3000 });
      this.router.navigate(['/settings/storage']);
      return;
    }

    this.storageService.getStorageUnit(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.storageUnit = response.data[0];
        } else {
          this.snackBar.open(response.message || 'Error loading storage unit', 'Close', { duration: 3000 });
          this.router.navigate(['/settings/storage']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading storage unit:', error);
        this.snackBar.open('Error loading storage unit', 'Close', { duration: 3000 });
        this.router.navigate(['/settings/storage']);
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/settings/storage']);
  }

  onEdit(): void {
    if (this.storageUnit?.id) {
      this.router.navigate(['/settings/storage', this.storageUnit.id, 'edit']);
    }
  }

  getFillPercentage(): number {
    if (!this.storageUnit?.maxCapacity || this.storageUnit.maxCapacity <= 0) {
      return 0;
    }
    return (this.storageUnit.currentVolume / this.storageUnit.maxCapacity) * 100;
  }

  getFillLevelClass(): string {
    const percentage = this.getFillPercentage();
    if (percentage >= 90) return 'fill-level-high';
    if (percentage >= 70) return 'fill-level-medium';
    return 'fill-level-low';
  }

  getStatusClass(): string {
    return `status-${this.storageUnit?.status?.toLowerCase()}`;
  }

  getStatusIcon(): string {
    switch (this.storageUnit?.status) {
      case 'AVAILABLE':
        return 'check_circle';
      case 'FULL':
        return 'full';
      case 'FILLING':
        return 'trending_up';
      case 'MAINTENANCE':
        return 'build';
      case 'IN_USE':
        return 'inventory';
      case 'CLEANING':
        return 'cleaning_services';
      case 'RESERVED':
        return 'event_available';
      case 'OUT_OF_SERVICE':
        return 'block';
      default:
        return 'help';
    }
  }

  getStatusIconClass(): string {
    return `status-icon-${this.storageUnit?.status?.toLowerCase()}`;
  }
} 
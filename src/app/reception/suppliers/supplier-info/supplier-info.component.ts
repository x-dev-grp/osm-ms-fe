import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';
import { BaseType } from '../../../shared/models/base-type';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CardComponent } from '../../../theme/components/card/card.component';

@Component({
  selector: 'app-supplier-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, TranslateModule, CardComponent],
  templateUrl: './supplier-info.component.html',
  styleUrls: ['./supplier-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierInfoComponent implements OnInit, OnDestroy {
  supplier: SupplierType | null = null;
  loading = false;
  error: string | null = null;

  private subs = new Subscription();
  private inDialog = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierTypeService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    @Optional() public dialogRef?: MatDialogRef<SupplierInfoComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { supplierId?: string }
  ) {
    this.inDialog = !!this.dialogRef || !!this.dialogData;
  }

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id') || undefined;
    const idFromDialog = this.dialogData?.supplierId || undefined;

    const supplierId = idFromDialog ?? idFromRoute;
    if (!supplierId) {
      this.error = this.translate.instant('SUPPLIER.ERRORS.NOT_FOUND') || 'Supplier not found';
      this.cdr.markForCheck();
      return;
    }

    this.fetchSupplier(supplierId);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---- UI helpers
  get fullName(): string {
    const n = this.supplier?.name ?? '';
    const l = this.supplier?.lastname ?? '';
    return [n, l].filter(Boolean).join(' ').trim();
  }

  get regionName(): string {
    const r = this.supplier?.region as BaseType | undefined;
    return r?.name ?? '';
  }

  // ---- Actions (no outputs, just local behaviors)
  onEdit(): void {
    const id = this.supplier?.id;
    if (!id) return;
    if (this.inDialog) {
      // In dialog: close and let parent open edit screen if needed
      this.dialogRef?.close({ action: 'edit', id });
    } else {
      this.router.navigate(['/reception/fournisseur', id, 'edit']).catch(() => {});
    }
  }

  onClose(): void {
    if (this.inDialog) {
      this.dialogRef?.close();
    } else {
      // Navigate back to list
      this.router.navigate(['/reception/fournisseur']).catch(() => {});
    }
  }

  // ---- Data
  private fetchSupplier(id: string): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    const sub = this.supplierService.getSupplier(id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.supplier = (Array.isArray(res.data) ? res.data[0] : res.data) as SupplierType;
        } else {
          this.error = this.translate.instant('SUPPLIER.ERRORS.NOT_FOUND') || 'Supplier not found';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading supplier:', err);
        this.error = this.translate.instant('SUPPLIER.ERRORS.LOAD') || 'Error while loading supplier';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    this.subs.add(sub);
  }
}

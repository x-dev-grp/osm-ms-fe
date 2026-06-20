import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { OilContainer } from '../../../shared/models/oil-container';
import { OilContainerService } from '../../../shared/services/oil-Container.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-add-oil-container',
  imports: [CommonModule, MatTableModule, MatIconModule, SharedModule, TranslateModule],
  templateUrl: './add-oil-container.component.html',
  standalone: true,
  styleUrl: './add-oil-container.component.scss'
})
export class AddOilContainerComponent implements OnInit {
  containerForm!: FormGroup;
  isEditMode = false;
  isSaving = false;
  currentId?: string;
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(OilContainerService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.buildForm();

    this.currentId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEditMode = !!this.currentId;

    if (this.isEditMode && this.currentId) {
      this.loadContainer(this.currentId);
    }
  }

  cancel(): void {
    this.router.navigate(['/storage/oil-container']);
  }

  onSubmit(): void {
    if (this.containerForm.invalid) {
      this.containerForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;

    const v = this.containerForm.value;
    const payload: OilContainer = {
      ...(this.currentId ? { id: this.currentId } : {}),
      name: (v.name as string).trim(),
      description: (v.description as string).trim(),
      capacityInLiters: Number(v.capacityInLiters),
      stockQuantity: Number(v.stockQuantity),
      buyPrice: v.buyPrice !== null && v.buyPrice !== undefined ? Number(v.buyPrice) : 0,
      sellingPrice: Number(v.sellingPrice),
      active: !!v.active
    };

    const request$ = this.isEditMode ? this.service.updateOilContainer(payload) : this.service.addOilContainer(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(this.isEditMode ? 'OIL_CONTAINER.MESSAGES.UPDATED' : 'OIL_CONTAINER.MESSAGES.CREATED');
        this.router.navigate(['/storage/oil-container']);
      },
      error: (err: any) => {
        console.error('Save error:', err);
        this.isSaving = false;
      }
    });
  }

  private buildForm(): void {
    this.containerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [''],
      capacityInLiters: [null, [Validators.required, Validators.min(0.1)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      buyPrice: [null, [Validators.min(0)]],
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      active: [true]
    });
  }

  private loadContainer(id: string): void {
    this.service.getOilContainer(id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res; // support {success,data} or plain payload
        if (data) {
          // Only patch known fields (ignore legacy ones that may still exist on the server)
          const patch: Partial<OilContainer> = {
            name: data.name,
            capacityInLiters: data.capacityInLiters,
            stockQuantity: data.stockQuantity,
            description: data.description,
            buyPrice: data.buyPrice,
            sellingPrice: data.sellingPrice,
            active: data.active
          };
          this.containerForm.patchValue(patch);
        }
      },
      error: (err) => {
        console.error('Error loading oil container:', err);
        this.toast.error('AUTO.FAILED_TO_LOAD_OIL_CONTAINER');
      }
    });
  }
}

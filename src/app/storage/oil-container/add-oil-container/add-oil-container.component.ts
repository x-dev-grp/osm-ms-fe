import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { OilContainer } from '../../../shared/models/oil-container';
import { OilContainerService } from '../../../shared/services/oil-Container.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-add-oil-container',
  imports: [CommonModule, MatTableModule, MatIconModule, SharedModule, TranslateModule, OsmDashboard],
  templateUrl: './add-oil-container.component.html',
  standalone: true,
  styleUrl: './add-oil-container.component.scss'
})
export class AddOilContainerComponent implements OnInit {
  containerForm: FormGroup;
  isSaving = false;
  isEditMode = false;
  containerId: string | null;

  constructor(
    private fb: FormBuilder,
    private service: OilContainerService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.containerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      lotNumber: ['', [Validators.maxLength(1000)]],
      capacityInLiters: [null, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      material: ['', [Validators.maxLength(50)]],
      buyPrice: [null, [Validators.required, Validators.min(0)]],
      sellingPrice: [null, [Validators.required, Validators.min(0)]],
      reorderThreshold: [null],
      reorderQuantity: [null],
      barcode: ['', [Validators.maxLength(100)]],
      storageLocationCode: ['', [Validators.maxLength(100)]],
      active: [true, Validators.required],
      certification: ['', [Validators.maxLength(100)]]
    });
    this.containerId = this.route.snapshot.paramMap.get('id');
     if (this.containerId) {
      this.isEditMode = true;
      this.loadContainer(this.containerId);
    }
   }

  onSubmit(): void {
    if (this.containerForm.invalid) {
      this.containerForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload: OilContainer = this.containerForm.value;
    const request = this.isEditMode ? this.service.updateOilContainer(payload) : this.service.addOilContainer(payload);

    request.subscribe({
      next: () => this.router.navigate(['/oil-containers']),
      error: () => (this.isSaving = false)
    });
  }

  cancel(): void {
    this.router.navigate(['/oil-containers']);
  }

  private loadContainer(id: string): void {
     this.service.getOilContainer(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.containerForm.patchValue(response.data);
        }
       },
      error: (error) => {
        console.error('Error loading bank account:', error);
        this.toast.error('Error loading bank account details');
       }
    });
  }
}

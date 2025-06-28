import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SharedModule } from '../../demo/shared/shared.module';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { BaseType } from '../../shared/models/base-type';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { TypeCategory } from '../../shared/models/type-category.enum';

@Component({
  selector: 'app-storage-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    SharedModule
  ],
  templateUrl: './storage-add.component.html',
  styleUrls: ['./storage-add.component.scss']
})
export class StorageAddComponent implements OnInit, OnDestroy {
  loading = false;
  isEditing = false;
  errorMessage: string | null = null;
  storageForm: FormGroup;

  oilTypes: BaseType[] = [];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private storageService: StorageUnitDtoService,
    private oilTypeService: GenericTypeService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.storageForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      maxCapacity: [0, [Validators.required, Validators.min(0)]],
      currentVolume: [0, [Validators.required, Validators.min(0)]],
      status: ['AVAILABLE', Validators.required],
      oilType: [null, Validators.required],
      nextMaintenanceDate: [null],
      lastInspectionDate: [null]
    });
  }

  ngOnInit(): void {
    this.loading = true;
    const storageId = this.route.snapshot.paramMap.get('id');
    this.isEditing = storageId !== null && storageId !== 'new';

    Promise.all([
      this.oilTypeService.getAllTypes(TypeCategory.OIL_VARIETY).toPromise(),
      this.isEditing && storageId ? this.storageService.getStorageUnit(storageId).toPromise() : Promise.resolve(null)
    ])
      .then(([oilTypes, storage]) => {
        this.oilTypes = oilTypes?.success ? oilTypes.data : [];

        if (this.isEditing && storage?.success && storage.data) {
          this.patchForm(storage.data[0]);
        } else if (this.isEditing) {
          this.errorMessage = 'Error loading storage unit.';
          this.showToast(this.errorMessage);
          this.router.navigate(['/storage']);
          return;
        }

        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading data:', error);
        this.errorMessage = 'Error loading data.';
        this.showToast(this.errorMessage);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  save(): void {
    if (this.storageForm.invalid) {
      this.showToast('Please fill in all required fields.');
      return;
    }

    const payload = this.storageForm.value as StorageUnitDto;

    const op = this.isEditing
      ? this.storageService.updateStorageUnit(payload).toPromise()
      : this.storageService.createStorageUnit(payload).toPromise();

    this.loading = true;
    op
      .then((res) => {
        if (res?.success) {
          this.showToast(this.isEditing ? 'Storage unit updated successfully' : 'Storage unit created successfully');
          this.router.navigate(['/storage']);
        } else {
          this.showToast(res?.message || 'Operation failed');
        }
      })
      .catch(() => this.showToast('Server error'))
      .finally(() => (this.loading = false));
  }

  onBack(): void {
    this.router.navigate(['/storage']);
  }

  private patchForm(storage: StorageUnitDto): void {
    this.storageForm.patchValue({
      ...storage,
      oilType: this.oilTypes.find(t => t.id === storage.oilType?.id) || null
    });
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}

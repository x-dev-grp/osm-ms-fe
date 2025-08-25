import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {SharedModule} from '../../shared/shared.module';
import {StorageUnitDto} from '../../shared/models/StorageUnitDto';
import {BaseType} from '../../shared/models/base-type';
import {StorageUnitDtoService} from '../../shared/services/storage.service';
import {GenericTypeService} from '../../shared/services/generic-type.service';
import {TypeCategory} from '../../shared/models/type-category.enum';
import { ToastService } from '../../shared/services/toast.service';

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

  oilVarietys: BaseType[] = [];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private storageService: StorageUnitDtoService,
    private oilTypeService: GenericTypeService,
    private toast: ToastService,
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
      oilVariety: [null, Validators.required],
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
      .then(([oilVarietys, storage]) => {
        this.oilVarietys = oilVarietys?.success ? oilVarietys.data : [];

        const unit = Array.isArray(storage?.data) ? storage?.data[0] : storage?.data;

        if (this.isEditing && storage?.success && unit) {
          this.patchForm(unit as StorageUnitDto);

        } else if (this.isEditing) {
          this.errorMessage = 'Error loading storage unit.';
          this.toast.error(this.errorMessage);
          this.router.navigate(['/storage']);
          return;
        }

        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading data:', error);
        this.errorMessage = 'Error loading data.';
        this.toast.error(this.errorMessage);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  save(): void {
    if (this.storageForm.invalid) {
      this.toast.warning('Please fill in all required fields.');
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
          this.toast.success(this.isEditing ? 'Storage unit updated successfully' : 'Storage unit created successfully');
          this.router.navigate(['/storage']);
        } else {
          this.toast.error(res?.message || 'Operation failed');
        }
      })
      .catch(() => this.toast.error('Server error'))
      .finally(() => (this.loading = false));
  }

  onBack(): void {
    this.router.navigate(['/storage']);
  }

  private patchForm(storage: StorageUnitDto): void {
    console.log('Patch storage:', storage);
    console.log('oilVarietys:', this.oilVarietys);

    this.storageForm.patchValue({
      ...storage,
      oilVariety: this.oilVarietys.find(t => t.id === storage.oilVariety?.id) || null,
      nextMaintenanceDate: storage.nextMaintenanceDate ? new Date(storage.nextMaintenanceDate) : null,
      lastInspectionDate: storage.lastInspectionDate ? new Date(storage.lastInspectionDate) : null
    });
  }


}

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { MatFormField } from '@angular/material/form-field';
import { SupplierComponent } from '../../shared/modules/supplierList/supplier.component';
import { SharedModule } from '../../shared/shared.module';
import { DecimalPipe, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
export interface ChangeSupplierDto {
  /** Path param */
  storageId: string;
  /** Query param (may be null) */
  supplierId?: string | null;
}
@Component({
  selector: 'app-assign-supplier',
  templateUrl: './assign-supplier.component.html',
  standalone: true,
  imports: [TranslateModule, MatDialogContent, MatFormField, SupplierComponent, SharedModule, DecimalPipe, NgIf],
  styleUrls: ['./assign-supplier.component.scss']
})
export class AssignSupplierComponent implements OnInit {
  public form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private storageService: StorageUnitDtoService,
    private dialogRef: MatDialogRef<AssignSupplierComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      storageUnit: StorageUnitDto;
    }
  ) {}

  ngOnInit(): void {
    const currentId = this.data.storageUnit.supplier ?? null;

    // build form
    this.form = this.fb.group({
      supplierId: [null],
      hasSupplier: [!!currentId]
    });

    // disable the checkbox if there was no assigned supplier
    if (!currentId) {
      this.form.get('hasSupplier')!.disable();
    } else {
      this.form.get('supplierId')?.setValue(currentId);
    }

    // when unchecked, clear & disable
    this.form.get('hasSupplier')!.valueChanges.subscribe((flag) => {
      if (!flag) {
        this.form.get('supplierId')!.setValue(null);
        this.form.get('hasSupplier')!.disable();
      }
    });
  }

  /** Called when user picks a supplier from your <supplierList> */
  onSupplierSelected(option: any) {
    const ctrl = this.form.get('hasSupplier')!;

    ctrl.setValue(true);
    ctrl.enable();
  }

  save() {
    const supplierId = this.form.value.supplierId;
    console.log(supplierId);
    if (supplierId) {
    }
    const dto: ChangeSupplierDto = {
      storageId: this.data.storageUnit.id!,
      supplierId: this.form.value.hasSupplier ? supplierId?.id : null
    };
    this.storageService.assignSupplier(dto).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false)
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

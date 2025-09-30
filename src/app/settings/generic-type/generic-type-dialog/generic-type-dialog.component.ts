import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// ⬇️ Adjust these paths to your project structure
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { BaseType } from '../../../shared/models/base-type';
// Optional: if you have a typed ApiResponse, import it
// import { ApiResponse } from '../../../shared/models/api-response';

export interface GenericTypeDialogData {
  /** Pre-select this category (e.g., 'PARCEL') */
  initialType?: string | TypeCategory | null;
  /** All available categories to show in the select */
  typeCategories: (string | TypeCategory)[];
}

@Component({
  standalone: true,
  selector: 'app-generic-type-dialog',
  templateUrl: './generic-type-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class GenericTypeDialogComponent implements OnInit {
  form!: FormGroup;
  typeCategories: string[] = Object.keys(TypeCategory);
  submitting = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<GenericTypeDialogComponent, BaseType | null>,
    private typeService: GenericTypeService,
    @Inject(MAT_DIALOG_DATA) public data: GenericTypeDialogData
  ) {}

  ngOnInit(): void {
    // Normalize categories to strings and dedupe

    // Case-insensitive match for initialType; fallback to first category
    const want = String(this.data?.initialType ?? '');
    const found = this.typeCategories.find((c) => c.toUpperCase() === want.toUpperCase());
    const defaultType = found ?? this.typeCategories[0] ?? '';

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: [defaultType, [Validators.required]]
    });
  }

  cancel(): void {
    if (this.submitting) return;
    this.ref.close(null);
  }

  save(): void {
    if (this.form.invalid || this.submitting) return;

    this.submitting = true;
    this.errorMsg = '';

    const { name, description, type } = this.form.value as {
      name: string;
      description?: string;
      type: TypeCategory;
    };

    const payload: BaseType = {
      name: String(name || '').trim(),
      description: String(description || '').trim(),
      type
    };

    // Your provided signature: createType(baseType: BaseType)
    this.typeService.createType(payload).subscribe({
      // If you have a typed ApiResponse<T>, update the next signature accordingly.
      next: (res: any /* ApiResponse<BaseType> */) => {
        // Try common ApiResponse shapes; fallback to res
        const created: BaseType = (res && (res.data || res.content || res.result || res.payload)) ?? res;
        this.submitting = false;
        this.ref.close(created || null);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'Failed to create type';
      }
    });
  }
  close(result?: BaseType): void {
    if (this.ref) {
       this.ref.close(result); // ← retire le `?? true`
    }
  }

}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { BaseType } from '../../../shared/models/base-type';
import { ToastService } from '../../../shared/services/toast.service';
import { CardComponent } from '../../../theme/components/card/card.component';
import { BASE_TYPE_CATEGORIES } from '../BASE_TYPE_DASHBOARD';

@Component({
  selector: 'app-generic-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent
  ],
  templateUrl: './generic-type-form.component.html',
  styleUrl: './generic-type-form.component.scss'
})
export class GenericTypeFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitting = false;
  isEditing = false;
  viewMode = false;
  errorMessage: string | null = null;
  typeCategories = BASE_TYPE_CATEGORIES;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: GenericTypeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.viewMode = this.route.snapshot.url.some((segment) => segment.path === 'view');
    this.isEditing = !!id && id !== 'new' && !this.viewMode;

    this.form = this.fb.group({
      id: [''],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: [this.resolveInitialType(), Validators.required]
    });

    if (this.viewMode) {
      this.form.disable();
    }

    if (this.isEditing || this.viewMode) {
      this.loadType(id!);
    }
  }

  save(): void {
    if (this.form.invalid || this.submitting || this.viewMode) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: BaseType = { ...this.form.getRawValue() };
    this.submitting = true;

    const request$ = this.isEditing ? this.service.updateType(payload) : this.service.createType(payload);

    request$.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'BASE_TYPE.MESSAGES.UPDATE_SUCCESS' : 'BASE_TYPE.MESSAGES.CREATE_SUCCESS');
        this.backToList();
      },
      error: () => this.toast.error('BASE_TYPE.MESSAGES.SAVE_FAILED')
    });
  }

  backToList(): void {
    const type = this.form.get('type')?.value as TypeCategory | undefined;
    this.router.navigate(['/settings/generic'], {
      queryParams: type ? { type } : undefined
    });
  }

  private loadType(id: string): void {
    this.loading = true;
    this.service
      .getType(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const raw = res?.data as BaseType | BaseType[] | undefined;
          const data = Array.isArray(raw) ? raw[0] : raw;
          if (!data) {
            this.errorMessage = 'BASE_TYPE.MESSAGES.NOT_FOUND';
            return;
          }
          this.form.patchValue(data);
        },
        error: () => {
          this.errorMessage = 'BASE_TYPE.MESSAGES.LOAD_FAILED';
          this.toast.error(this.errorMessage);
        }
      });
  }

  private resolveInitialType(): TypeCategory {
    const queryType = this.route.snapshot.queryParamMap.get('type') as TypeCategory | null;
    if (queryType && Object.values(TypeCategory).includes(queryType)) {
      return queryType;
    }
    return TypeCategory.REGION;
  }
}

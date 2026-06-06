import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatChip } from '@angular/material/chips';
import { HttpErrorResponse } from '@angular/common/http';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-filtration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIcon,

  ],
  templateUrl: './filtration-form.component.html',
  styleUrls: ['./filtration-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrationFormComponent implements OnInit {
  loading = signal(false);
  loadingUnits = signal(false);

  isEdit = false;
  op?: FiltrationOperation;

  sourceUnits = signal<StorageUnitDto[]>([]);
  targetUnits = signal<StorageUnitDto[]>([]);

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(FiltrationApiService);
  private readonly storageUnitService = inject(StorageUnitDtoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  createForm = this.fb.group({
    source: ['', Validators.required],
    target: ['', Validators.required],
    volumeToFilter: [0, [Validators.required, Validators.min(0.001)]],
    note: [''],
  });

  noteForm = this.fb.group({
    note: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;

    this.loadStorageUnits();

    if (this.isEdit && id) {
      this.loading.set(true);
      this.api.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (op) => {
          this.op = op;
          this.loading.set(false);

          if (op.status === 'IN_PROGRESS' || op.status === 'CANCELLED') {
            this.toastService.error('Modification impossible pour cette opération.');
            this.router.navigate(['storage', 'oil-filtering']);
            return;
          }

          if (op.status === 'CREATED') {
            this.createForm.patchValue({
              source: op.source?.id ?? '',
              target: op.target?.id ?? '',
              volumeToFilter: op.volumeFiltered ?? 0,
              note: op.note ?? '',
            });
          }

          if (op.status === 'COMPLETED') {
            this.noteForm.patchValue({
              note: op.note ?? '',
            });
          }
        },
        error: () => {
          this.loading.set(false);
          this.toastService.error('Impossible de charger l’opération.');
          this.router.navigate(['storage', 'oil-filtering']);
        },
      });
    }
  }

  isCreatedEdit(): boolean {
    return this.isEdit && this.op?.status === 'CREATED';
  }

  isCompletedEdit(): boolean {
    return this.isEdit && this.op?.status === 'COMPLETED';
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;

    this.loading.set(true);

    const payload = {
      source: this.createForm.value.source as string,
      target: this.createForm.value.target as string,
      volumeToFilter: this.createForm.value.volumeToFilter as number,
      note: (this.createForm.value.note ?? '') as string,
    };

    const req$ = this.isCreatedEdit() && this.op
      ? this.api.update(this.op.operationId, payload as any)
      : this.api.create(payload as any);

    req$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success(
            this.isCreatedEdit()
              ? 'Opération modifiée avec succès.'
              : 'Opération créée avec succès.'
          );
          this.router.navigate(['storage', 'oil-filtering']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);

          let message = 'Une erreur est survenue.';
          if (err?.error?.message) {
            message = err.error.message;
          } else if (typeof err?.error === 'string') {
            message = err.error;
          } else if (err.message) {
            message = err.message;
          }

          this.toastService.error(message);
        },
      });
  }

  submitAddNote(): void {
    if (!this.op || !this.isCompletedEdit()) return;
    if (this.noteForm.invalid) return;

    const payload = {
      source: this.op.source?.id,
      target: this.op.target?.id,
      volumeToFilter: this.op.volumeFiltered,
      note: (this.noteForm.value.note ?? '').trim(),
    };

    this.loading.set(true);

    this.api.update(this.op.operationId, payload as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success('Note modifiée avec succès.');
          this.router.navigate(['storage', 'oil-filtering']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);

          let message = 'Une erreur est survenue.';
          if (err?.error?.message) {
            message = err.error.message;
          } else if (typeof err?.error === 'string') {
            message = err.error;
          } else if (err.message) {
            message = err.message;
          }

          this.toastService.error(message);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['storage', 'oil-filtering']);
  }

  unitLabel(u: StorageUnitDto): string {
    const name = (u as any)?.name ?? (u as any)?.code ?? u.id;
    const cur = (u as any)?.currentVolume;
    const max = (u as any)?.maxCapacity;

    if (cur != null && max != null) return `${name} — ${cur}/${max} L`;
    return `${name}`;
  }

  trackById = (_: number, u: StorageUnitDto) => u.id;

  private loadStorageUnits(): void {
    this.loadingUnits.set(true);

    this.storageUnitService
      .getAllStorageUnit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const units: StorageUnitDto[] = (res?.data ?? []) as StorageUnitDto[];

          this.sourceUnits.set((units || []).filter((u) => u?.filteredOil !== true));
          this.targetUnits.set((units || []).filter((u) => u?.filteredOil === true));

          this.loadingUnits.set(false);
        },
        error: () => {
          this.sourceUnits.set([]);
          this.targetUnits.set([]);
          this.loadingUnits.set(false);
        },
      });
  }
}

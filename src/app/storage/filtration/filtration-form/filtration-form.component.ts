import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';

import {FiltrationApiService} from '../../../shared/services/filtration-api.service';
import {FiltrationOperation} from '../../../shared/models/filtration-operation';

import {StorageUnitDtoService} from '../../../shared/services/storage.service';
import {StorageUnitDto} from '../../../shared/models/StorageUnitDto';
import {ToastService} from "../../../shared/services/toast.service";
import {HttpErrorResponse} from "@angular/common/http";
import {MatIcon} from "@angular/material/icon";
import {MatChip} from "@angular/material/chips";

@Component({
  selector: 'app-filtration-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,

    MatFormFieldModule, MatProgressSpinnerModule, MatInputModule, MatButtonModule, MatSelectModule, MatIcon, MatChip,],
  templateUrl: './filtration-form.component.html',
  styleUrls: ['./filtration-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrationFormComponent implements OnInit {
  // Loading global (édition + submit).
  loading = signal(false);
  // Loading liste des cuves pour les dropdowns.
  loadingUnits = signal(false);
  isEdit = false;
  op?: FiltrationOperation;
  // - targetUnits: filteredOil === true
  sourceUnits = signal<StorageUnitDto[]>([]);
  targetUnits = signal<StorageUnitDto[]>([]);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  // Important: on envoie l’UUID au backend (pas l’objet).
  createForm = this.fb.group({
    source: ['', Validators.required], // UUID source
    target: ['', Validators.required], // UUID target
    volumeToFilter: [0, [Validators.required, Validators.min(0.001)]], note: [''],
  });
  // Formulaire édition: ajout de note uniquement.
  noteForm = this.fb.group({
    note: ['', [Validators.required, Validators.minLength(1)]],
  });

  // Lists pour dropdowns:
  // - sourceUnits: filteredOil === false
  private readonly api = inject(FiltrationApiService);
  private readonly storageUnitService = inject(StorageUnitDtoService);

  // Formulaire création: on stocke l’UUID de la cuve (string).
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;

    // Charger la liste des cuves pour les dropdowns (uniquement utile en création).
    // (Tu peux aussi laisser ce load même en édition, ça ne casse rien.)
    this.loadStorageUnits();

    if (this.isEdit && id) {
      this.loading.set(true);
      this.api.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (op) => {
          this.op = op;
          this.loading.set(false);

          // Règle: pas de modification si IN_PROGRESS.
          if ((op.status as string) === 'IN_PROGRESS') {
            this.router.navigate(['storage', 'oil-filtering']);
          }
        }, error: () => {
          this.loading.set(false);
          this.router.navigate(['storage', 'oil-filtering']);
        },
      });
    }
  }

  // Le payload contient bien l’UUID sélectionné (source/target).
  submitCreate(): void {
    if (this.createForm.invalid) return;

    this.loading.set(true);

    const payload = {
      source: this.createForm.value.source as string,
      target: this.createForm.value.target as string,
      volumeToFilter: this.createForm.value.volumeToFilter as number,
      note: (this.createForm.value.note ?? '') as string,
    };

    this.api.create(payload as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toastService.success('Opération créée avec succès.');
         },

        error: (err: HttpErrorResponse) => {
          this.loading.set(false);

          // 🔴 Extract backend validation message safely
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

  // Création: POST /filtration.

  // Ajout note en édition via updateStatus en gardant le même statut.
  submitAddNote(): void {
    if (!this.op) return;
    if (this.noteForm.invalid) return;

    const note = (this.noteForm.value.note ?? '').trim();
    if (!note) return;

    this.loading.set(true);

    this.api
      .updateStatus(this.op.operationId, {status: this.op.status as any, note})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['storage', 'oil-filtering']);
        }, error: () => this.loading.set(false),
      });
  }

  cancel(): void {
    this.router.navigate(['storage', 'oil-filtering']);
  }

  // Minimal: nom + capacité (si dispo).
  unitLabel(u: StorageUnitDto): string {
    const name = (u as any)?.name ?? (u as any)?.code ?? u.id;
    const cur = (u as any)?.currentVolume;
    const max = (u as any)?.maxCapacity;

    if (cur != null && max != null) return `${name} — ${cur}/${max} L`;
    return `${name}`;
  }

  // Affichage option (texte).

  trackById = (_: number, u: StorageUnitDto) => u.id;

  private loadStorageUnits(): void {
    this.loadingUnits.set(true);

    // Même logique que StorageUnitsBoard: getAllStorageUnit().pipe(map(res => res.data ?? []))
    this.storageUnitService
      .getAllStorageUnit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const units: StorageUnitDto[] = (res?.data ?? []) as StorageUnitDto[];

          // Source: non filtrées
          const sources = (units || []).filter((u) => u?.filteredOil !== true);

          // Target: filtrées
          const targets = (units || []).filter((u) => u?.filteredOil === true);

          this.sourceUnits.set(sources);
          this.targetUnits.set(targets);

          this.loadingUnits.set(false);
        }, error: () => {
          this.sourceUnits.set([]);
          this.targetUnits.set([]);
          this.loadingUnits.set(false);
        },
      });
  }
}

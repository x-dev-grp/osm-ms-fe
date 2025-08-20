import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Optionnel: support MatDialog si un jour tu veux ouvrir ce composant en modal réel
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { inject as di, Optional } from '@angular/core';
import { Subscription } from 'rxjs';

// Adapte ce chemin à ton projet
import { GenericTypeService } from 'src/app/shared/services/generic-type.service';
import { TypeCategory } from 'src/app/shared/models/type-category.enum';
import { BaseType } from '../../../shared/models/base-type';

@Component({
  selector: 'app-add-basetype',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './add-basetype.component.html',
  styleUrls: ['./add-basetype.component.scss']
})
export class AddBasetypeComponent implements OnInit, OnDestroy {
  // Core services
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private service = inject(GenericTypeService);

  // Optionnel (si lancé via MatDialog)
  private dialogRef = di<MatDialogRef<AddBasetypeComponent>>(MatDialogRef, { optional: true });
  private dialogData = di<any>(MAT_DIALOG_DATA, { optional: true });

  form!: FormGroup;
  editing = false;
  currentRecord: BaseType | null = null;
  categoryFromQuery: TypeCategory | null = null;

  typeOptions = [
    { value: TypeCategory.REGION,        label: 'Région' },
    { value: TypeCategory.OLIVE_VARIETY, label: 'Variété d’olive' },
    { value: TypeCategory.OIL_VARIETY,   label: 'Variété d’huile' },
    { value: TypeCategory.WASTE_TYPE,    label: 'Type de déchet' }
  ];

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.form = this.fb.group({
      type: [null, Validators.required],
      name: ['', Validators.required],
      description: ['']
    });

    // Mode dialog (optionnel) : pré-remplissage depuis MAT_DIALOG_DATA
    if (this.dialogData?.record) {
      this.editing = !!this.dialogData.record?.id;
      this.currentRecord = this.dialogData.record;
      this.form.patchValue({
        type: this.dialogData.record.type ?? null,
        name: this.dialogData.record.name ?? '',
        description: this.dialogData.record.description ?? ''
      });
      return;
    }

    // Mode route : lecture params
    const id = this.route.snapshot.paramMap.get('id');
    const qpCat = this.route.snapshot.queryParamMap.get('category') as TypeCategory | null;
    this.categoryFromQuery = qpCat ?? null;

    if (this.categoryFromQuery) {
      this.form.get('type')?.setValue(this.categoryFromQuery);
    } else if (!id) {
      // défaut si ajout sans query param
      this.form.get('type')?.setValue(TypeCategory.REGION);
    }

    if (id) {
      this.editing = true;
      const s = this.service.fetchById(id).subscribe((dto: BaseType) => {
        this.currentRecord = dto;
        this.form.patchValue({
          type: dto.type,
          name: dto.name,
          description: dto.description ?? ''
        });
      });
      this.subs.push(s);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get title(): string {
    return this.editing ? 'Modifier le type' : 'Ajouter un type';
  }

  // === LOGIQUE DE SAVE demandée ===
  onSave(): void {
    const payload: BaseType = { ...this.form.value };
    if (this.currentRecord?.id) payload.id = this.currentRecord.id;

    const op = this.currentRecord
      ? this.service.updateType(payload)
      : this.service.createType(payload);

    const s = op.subscribe({
      next: () => this.close(),
    });
    this.subs.push(s);
  }

  close(): void {
    // 1) si MatDialog, on ferme le dialog
    if (this.dialogRef) {
      this.dialogRef.close(true);
      return;
    }
    // 2) sinon on revient à la liste
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/settings/generic']);
    }
  }
}

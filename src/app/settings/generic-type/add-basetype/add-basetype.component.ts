import {Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from 'rxjs';

import {GenericTypeService} from 'src/app/shared/services/generic-type.service';
import {TypeCategory} from 'src/app/shared/models/type-category.enum';
import {BaseType} from '../../../shared/models/base-type';

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
export class AddBasetypeComponent implements OnInit, OnDestroy, OnChanges {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private service = inject(GenericTypeService);

  @Input() options: BaseType[] = []; // Liste passée depuis le parent
  internalOptions: BaseType[] = [];

  form!: FormGroup;
  editing = false;
  currentRecord: BaseType | null = null;
  categoryFromQuery: TypeCategory | null = null;
  private dialogRef = inject(MatDialogRef<AddBasetypeComponent>, {optional: true});
  private dialogData = inject(MAT_DIALOG_DATA, {optional: true});
  private subs: Subscription[] = [];

  typeOptions = [
    { value: TypeCategory.REGION,        label: 'Région' },
    { value: TypeCategory.OLIVE_VARIETY, label: 'Variété d’olive' },
    { value: TypeCategory.OIL_VARIETY,   label: 'Variété d’huile' },
    { value: TypeCategory.WASTE_TYPE,    label: 'Type de déchet' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      type: [null, Validators.required],
      name: ['', Validators.required],
      description: ['']
    });

    // Si parent fournit des options, les utiliser
    if (this.options?.length) {
      this.internalOptions = [...this.options];
    }

    // === Mode Dialog ===
    if (this.dialogData?.record) {
      this.editing = !!this.dialogData.record.id;
      this.patchForm(this.dialogData.record);
      return;
    }

    // === Mode Route ===
    const id = this.route.snapshot.paramMap.get('id');
    const qpCat = this.route.snapshot.queryParamMap.get('category') as TypeCategory | null;
    this.categoryFromQuery = qpCat;

    if (this.categoryFromQuery) {
      this.form.get('type')?.setValue(this.categoryFromQuery);
    } else if (!id) {
      this.form.get('type')?.setValue(TypeCategory.REGION);
    }

    if (id) {
      this.editing = true;
      const s = this.service.fetchById(id).subscribe(dto => this.patchForm(dto));
      this.subs.push(s);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.options?.length) {
      this.internalOptions = [...this.options];
    }
  }


  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get title(): string {
    return this.editing ? 'Modifier le type' : 'Ajouter un type';
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }

    const payload: BaseType = { ...this.form.value };
    if (this.currentRecord?.id) payload.id = this.currentRecord.id;

    const op = this.editing
      ? this.service.updateType(payload)
      : this.service.createType(payload);

    const s = op.subscribe({
      next: (res) => {
        if (res?.success && res.data?.length) {
          // renvoie directement le BaseType créé au parent (OliveReceptionFormComponent)
          this.close(res.data[0]);
        } else {
          this.close(undefined);
        }
      },
      error: (error) => {
        console.error('Error saving base type:', error);
        this.close(undefined);
      }
    });
    this.subs.push(s);
  }

  close(result?: BaseType): void {
    if (this.dialogRef) {
      // ⚠️ Ne jamais fermer avec `true` si ce n'est pas un objet BaseType
      this.dialogRef.close(result); // ← retire le `?? true`
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/settings/generic']);
    }
  }

  private patchForm(record: BaseType): void {
    this.currentRecord = record;
    this.form.patchValue({
      type: record.type,
      name: record.name,
      description: record.description ?? ''
    });
  }
}

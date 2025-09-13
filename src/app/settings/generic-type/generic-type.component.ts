import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { BaseType } from '../../shared/models/base-type';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { DashboardConfig } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { BASE_TYPE } from './BASE_TYPE_DASHBOARD';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';

/** ===== Types & labels ===== */

@Component({
  selector: 'app-generic-type',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    OsmDashboard,
    MatCard,
    MatCardContent
  ],
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent implements OnInit, OnDestroy {
  @ViewChild('genericTypeDialog') genericTypeDialog!: TemplateRef<any>;
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  // Expose l'enum au template (important !)
  public TypeCategory = TypeCategory;

  // ==== UI state ====
  activeKey: TypeCategory = TypeCategory.REGION;
  dashboardConfig: DashboardConfig = BASE_TYPE;

  // ==== Dialog + Form ====
  dialogForm!: FormGroup;
  dialogRef!: MatDialogRef<unknown>;
  currentRecord: BaseType | null = null;
  // Options de type (affichage du select)
  typeOptions = [
    { value: TypeCategory.REGION, name: 'Région' },
    { value: TypeCategory.OLIVE_VARIETY, name: 'Variété d’olive' },
    { value: TypeCategory.OIL_VARIETY, name: 'Variété d’huile' },
    { value: TypeCategory.WASTE_TYPE, name: 'Type de déchet' },
    { value: TypeCategory.SUPPLIER_TYPE, name: 'Type de Fournisseur' }
  ];
  private translated: String;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private router: Router,
    private service: GenericTypeService
  ) {}

  ngOnInit(): void {
    this.dialogForm = this.fb.group({
      type: [null, Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
    // charge la liste par défaut
    this.applyCategory(this.activeKey);
  }

  // ========= Cartes =========
  loadRegion(): void {
    this.applyCategory(TypeCategory.REGION);
  }

  loadOliveVariety(): void {
    this.applyCategory(TypeCategory.OLIVE_VARIETY);
  }

  loadOilVariety(): void {
    this.applyCategory(TypeCategory.OIL_VARIETY);
  }

  loadWasteType(): void {
    this.applyCategory(TypeCategory.WASTE_TYPE);
  }

  loadSypplierTYpe(): void {
    this.applyCategory(TypeCategory.SUPPLIER_TYPE);
  }

  // ========= Dialog =========
  openDialog(record?: BaseType): void {
    this.currentRecord = record ?? null;
    if (record) {
      // Edition
      this.dialogForm.patchValue({
        type: record.type,
        name: record.name,
        description: record.description
      });
    } else {
      // Ajout — valeur par défaut = carte active
      this.dialogForm.reset();
      this.dialogForm.get('type')!.setValue(this.activeKey);
    }

    this.dialogRef = this.dialog.open(this.genericTypeDialog, { width: '600px' });

  }

  onCancel(): void {
    this.dialogRef?.close();
    this.currentRecord = null;
  }

  onTypeChange(value: TypeCategory): void {
    this.dialogForm.get('type')!.setValue(value);
  }

  onSave(): void {
     const payload: BaseType = { ...this.dialogForm.value };
    if (this.currentRecord?.id) payload.id = this.currentRecord.id;

    const op = this.currentRecord ? this.service.updateType(payload) : this.service.createType(payload);

    op.subscribe(() => {
      this.dialogRef.close();
      this._refreshDashboard(); // respecte refrechData() si dispo
    });
  }

  applyAction(event: { row: any; action: string }): void {
    switch (event.action) {
      case 'READ':
      case 'UPDATE':

        this.openDialog(event.row as BaseType);
        break;
    }
  }

  ngOnDestroy(): void {}

  private applyCategory(key: TypeCategory): void {
    this.activeKey = key;
    this.dashboardConfig = this.makeConfigFor(key);
    this._refreshDashboard();
  }

  private makeConfigFor(key: TypeCategory): DashboardConfig {
    const clone = (o: any) => JSON.parse(JSON.stringify(o));

    // On clone la config de base pour éviter les effets de bord
    const cfg: DashboardConfig = clone(this.dashboardConfig);

    // Mettre à jour le titre si tu veux
    this.translated = this.translateService.instant('BASE_TYPE.' + this.activeKey);
    cfg.title = `Types • ${this.translated}`;
    const baseDefault = clone(this.dashboardConfig.defaultSearchData ?? {});
    const baseSearchData = clone(baseDefault.searchData ?? {});
    const baseSearch = clone(baseSearchData.search ?? {});
    baseSearch.type = { equalValue: key };
    cfg.defaultSearchData = {
      ...baseDefault,
      searchData: {
        ...baseSearchData,
        search: {
          ...baseSearch
        }
      }
    };
    return cfg;
  }

  private initForm(): void {
    this.dialogForm = this.fb.group({
      type: ['', Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
  }

  private buildTypeOptions(): void {
    this.typeOptions = Object.keys(TypeCategory)
      .filter((k) => isNaN(Number(k)))
      .map((key) => ({ name: key, value: TypeCategory[key as keyof typeof TypeCategory] }));
  }

  // ========= Utils =========
  private _refreshDashboard(): void {
    if (this.dashboard?.refrechData) {
      this.dashboard.refrechData();
      return;
    }
  }
}

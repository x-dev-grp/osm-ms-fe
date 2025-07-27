import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { BaseType } from '../../shared/models/base-type';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { Subscription } from 'rxjs';
import { DashboardConfig } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { BASE_TYPE } from './BASE_TYPE_DASHBOARD';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';

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
    OsmDashboard
  ],
  templateUrl: './generic-type.component.html',
  styleUrls: ['./generic-type.component.scss']
})
export class GenericTypeComponent implements OnInit, OnDestroy {
  @ViewChild('genericTypeDialog') genericTypeDialog!: TemplateRef<any>;
  @ViewChild('dashboard') dashboard!: OsmDashboard;

  // Form and dialog
  dialogForm!: FormGroup;
  currentRecord?: BaseType;
  // Options for type dropdown
  typeOptions: { name: string; value: TypeCategory }[] = [];
  dashboardConfig: DashboardConfig = BASE_TYPE;
  private dialogRef!: MatDialogRef<any>;
  private dataSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service: GenericTypeService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.buildTypeOptions();

  }

  ngOnDestroy(): void {
    if (this.dataSub) this.dataSub.unsubscribe();
  }

  openDialog(record?: BaseType): void {
    this.currentRecord = record;
    if (record) {
      this.dialogForm.patchValue({
        type: record.type,
        name: record.name,
        description: record.description
      });
    } else {
      this.dialogForm.reset();
      this.dialogForm.get('type')!.setValue(this.typeOptions[0].value);
    }
    this.dialogRef = this.dialog.open(this.genericTypeDialog, { width: '600px' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    const payload: BaseType = { ...this.dialogForm.value };
    const op = this.currentRecord ? this.service.updateType(payload) : this.service.createType(payload);
    op.subscribe(() => {
      this.dialogRef.close();
      this.dashboard.refrechData();
    });
  }

  applyAction(event: { row: any; action: string }): void {
    switch (event.action) {
      case 'READ':
      case 'UPDATE':
        this.openDialog(event.row as BaseType);
        break;
      case 'DELETE':
        this.service.deleteType(event.row.type, event.row.id).subscribe(() => {
          // Optionally trigger dashboard refresh
        });
        break;
    }
  }

  onTypeChange(value: TypeCategory): void {
    this.dialogForm.get('type')!.setValue(value);
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
}

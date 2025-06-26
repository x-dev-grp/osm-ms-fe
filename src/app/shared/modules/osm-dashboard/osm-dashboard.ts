import { AfterViewInit, ChangeDetectorRef, Component, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { DashboardStore } from './services/dashboard-state.service';
import { Action, DashboardConfig, Field } from './models/dashboard-config';
import { Router } from '@angular/router';
import { DynamicInput } from './components/dynamic-input/dynamic-input.component';
import { map, Observable, tap } from 'rxjs';
import { ConfirmDialogComponent } from '../../component/confirm-dialog/confirm-dialog/confirm-dialog.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'osm-dashboard',
  templateUrl: './osm-dashboard.html',
  styleUrls: ['./osm-dashboard.scss'],
  standalone: true,
  providers: [DashboardStore],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    DynamicInput
  ]
})
export class OsmDashboard implements OnInit, AfterViewInit, OnChanges {
  readonly _store = inject(DashboardStore);
  _router = inject(Router);
  _dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  config = input.required<DashboardConfig>();
  applyAction = output<{ row: any; action: string }>();
  displayedColumns: string[] = [];
  actions: Action[] | undefined;
  private readonly _checked = 'checked';
  private readonly _delete = 'DELETE';
  private readonly  _actions = 'actions';
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }

  ngOnInit(): void {
    this.displayedColumns = [
      ...this.config()
        .fields.filter((field) => field.dataTable)
        .map((field) => field.label),
      this._actions
    ];
    console.log(this.displayedColumns);
    this._store.initialize(this.config()?.searchEndpoint, this.config().fields, this.config()?.defaultSearchData, this.config().fileName);
    if (!this.config().actions?.statusMapping) this.actions = this.config().actions?.actionsList;
    this.cdr.detectChanges(); // Force change detection
  }

  ngAfterViewInit(): void {}


  sortChange(event: any) {
    console.log(event);
    this._store.setSort(event.active, event.direction);
  }

  onPageChange(event: any) {
    this._store.setPageSize(event?.pageSize);
    this._store.setPage(event?.pageIndex);
  }

  getValue(path: string, object: any): any {
    return path?.split('.')?.reduce((acc, key) => acc && acc[key], object);
  }

  getSelectDataTableValue(value: string, fieldName: string): string {
    const field = this.config().fields.find((field) => field.name == fieldName);
    const option = field?.options?.find((option) => option.value == value);
    return option?.label || option?.value;
  }

  redirectToFormPage() {
    this._router.navigate([this.config().addNewItemUrl]);
  }

  onFilterFieldChange(event: any, field: Field) {
    this._store.setFilteredField(field, event?.target[this._checked]);
  }

  onExportFieldChange(event: any, field: Field) {
    this._store.setExportField(field, event?.target[this._checked]);
  }

  selectAllFilterFields(event: any) {
    this._store.setAllFilterField(event?.target[this._checked]);
  }

  selectAllExportFields(event: any) {
    this._store.setAllExportField(event?.target[this._checked]);
  }

  resetFilter() {
    this._store.resetSearchData();
  }

  exportPdf() {
    this._store.export('pdf');
  }

  exportCsv() {
    this._store.export('excel');
  }


  actionApply(action: string, row: any) {
    if (action === this._delete) {
      this._dialog.open(ConfirmDialogComponent, {
        data: { message:"delete" }
      }).afterClosed().pipe(
        tap(v=>{
          if(v)
            this._store.removeItem( row?.id,this.config().baseURL);
        })
      ).subscribe()
     //
      return;
    }
    this.applyAction.emit({ row: row, action: action });
  }
}

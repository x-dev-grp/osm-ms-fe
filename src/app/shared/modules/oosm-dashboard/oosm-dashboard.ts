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
import { SharedModule } from 'src/app/shared/shared.module';
import { DashboardStore } from './services/dashboard-state.service';
import { DashboardConfig, Field } from './models/dashboard-config';
import { Router } from '@angular/router';
import { DynamicInput } from './components/dynamic-input/dynamic-input.component';

import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';
import { ACTION_ICONS } from './models/actions';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SortByTranslatedPipe } from '../../pipes/sort-by-translated.pipe';
import { resolveListContext, translateHintWithFallback, translateWithFallback } from './models/list-context.util';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'oosm-dashboard',
  templateUrl: './oosm-dashboard.html',
  styleUrls: ['./oosm-dashboard.scss'],
  standalone: true,
  providers: [DashboardStore],
  imports: [
    TranslateModule,
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
    DynamicInput,
    MatCheckboxModule,
    MatTooltipModule,
    SortByTranslatedPipe
  ]
})
export class OosmDashboard implements OnInit, AfterViewInit, OnChanges {
  readonly _store = inject(DashboardStore);
  _router = inject(Router);
  _dialog = inject(MatDialog);
  config = input.required<DashboardConfig>();
  applyAction = output<{ row: any; action: string }>();
  addNewItemClick = output<void>();
  displayedColumns: string[] = [];
  actions: Map<string, string> = ACTION_ICONS;
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private _confirmationDialog = inject(ConfirmationDialogService);
  private readonly _checked = 'checked';
  private readonly _delete = 'DELETE';
  private readonly _actions = 'actions';
  private readonly _viewActions = ['READ', 'READ_ARTICLE', 'DETAIL'];
  dataTableFields$ = toObservable(this._store.dataTableFields);
  constructor() {
    this.dataTableFields$.pipe(takeUntilDestroyed()).subscribe((fields) => {
      console.log('dataTableFields$', fields);
      const cols = fields.filter((field) => field.dataTable).map((field) => field.label);
      if (!this.config()?.hideActions) {
        cols.push(this._actions);
      }
      this.displayedColumns = cols;
      console.log('displayColumns changed:', this.displayedColumns);
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.config()?.groupedActions) this.displayedColumns.unshift('ALL');
    this._store.initialize(
      this.config()?.searchEndpoint,
      this.config().fields,
      this.config()?.defaultSearchData,
      this.config().fileName,
      this.config().filterTenant,
      this.config()?.clientSide
    );

    this.cdr.detectChanges(); // Force change detection
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

  listContext() {
    return resolveListContext(this.config());
  }

  listContextTitle(): string {
    const ctx = this.listContext();
    if (!ctx) {
      return '';
    }
    return translateWithFallback(
      (key) => this.translate.instant(key),
      ctx.titleTranslatePath,
      'OSM_DASHBOARD.LIST_HINT.DEFAULT_TITLE',
      ctx.titleFallback
    );
  }

  listContextHint(): string {
    const ctx = this.listContext();
    if (!ctx) {
      return '';
    }
    return translateHintWithFallback((key) => this.translate.instant(key), ctx.hintTranslatePath);
  }

  sortChange(event: any) {
    // console.log(event);
    this._store.setSort(event.active, event.direction);
  }

  onPageChange(event: any) {
    this._store.setPageSize(event?.pageSize);
    this._store.setPage(event?.pageIndex);
  }
  trackByAction = (_: number, a: string) => a;

  getValue(path: string | undefined, object: any): any {
    return path?.split('.')?.reduce((acc, key) => acc && acc[key], object);
  }
  getTargetItemFromFlattedList(record: any, item: Field): any {
    if (!item?.flattedListName || !record?.[item.flattedListName]) return null;
    const targetList = record?.[item.flattedListName];
    const targetItem: any = targetList?.find((f: any) => this.getValue(item.nameField, f) == item?.name);
    return targetItem || targetList?.[item.flattedItemIndex ?? -1] || null;
  }

  getSelectDataTableValue(value: string, fieldName: string): string {
    const field = this.config().fields.find((field) => field.name == fieldName);
    const option = field?.options?.find((option) => option.value == value);
    return option?.labelTranslatePath || option?.label || option?.value;
  }

  redirectToFormPage() {
    const url = this.config().addNewItemUrl;
    if (url) {
      this._router.navigate([url]);
      return;
    }
    this.addNewItemClick.emit();
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
  refrechData() {
    this._store.fetchData();
  }

  setClientSource(rows: unknown[]) {
    this._store.setClientSource(rows);
    this._store.applyClientPage();
  }

  actionApply(action: string, row: unknown) {
    if (action === this._delete) {
      this._confirmationDialog.confirmDelete().subscribe((result) => {
        if (result.confirmed) {
          this._store.removeItem((row as { id: string })?.id, this.config().baseURL);
        }
      });
      return;
    }
    this.applyAction.emit({ row: row, action: action });
  }

  onRowDoubleClick(row: unknown, event: MouseEvent): void {
    if (this.config()?.hideActions || this._store.actionLoading()) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, mat-checkbox, .mat-mdc-checkbox, .mat-mdc-menu-panel')) {
      return;
    }

    const action = this.resolveViewAction(row);
    if (action) {
      this.actionApply(action, row);
    }
  }

  private resolveViewAction(row: unknown): string | null {
    const preferred = this.config()?.doubleClickAction;
    if (preferred && this.isActionAvailable(preferred, row)) {
      return preferred;
    }

    for (const action of this._viewActions) {
      if (this.isActionAvailable(action, row)) {
        return action;
      }
    }

    return null;
  }

  private isActionAvailable(action: string, row: unknown): boolean {
    if (this.config()?.filteredActions?.includes(action)) {
      return false;
    }

    const record = row as Record<string, unknown> & { actions?: string[] };
    const specificActions = this.config()?.specificActions;

    if (specificActions?.length) {
      const item = specificActions.find((entry) => entry.action === action);
      if (!item) {
        return false;
      }
      if (item.disabled?.field && record[item.disabled.field] === item.disabled.value) {
        return false;
      }
      return true;
    }

    return (record?.actions ?? []).includes(action);
  }
}

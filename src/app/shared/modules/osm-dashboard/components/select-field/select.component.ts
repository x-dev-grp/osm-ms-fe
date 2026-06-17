import { AfterViewInit, Component, DestroyRef, inject, input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';

import { AdvancedSearchService } from 'src/app/shared/services/advanced-serach.service';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { Field } from '../../models/dashboard-config';

import { DashboardStore } from '../../services/dashboard-state.service';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'select-field',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  standalone: true,
  imports: [TranslateModule, 
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule
  ]
})
export class SelectComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly destroyRef = inject(DestroyRef);
  _searchService = inject(AdvancedSearchService);
  _store = inject(DashboardStore);
  field = input.required<Field>();
  formControl: AbstractControl;
  ngOnDestroy(): void {}


  ngAfterViewInit(): void {
    this._store.resetFields$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formControl.reset(null, { emitEvent: false });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {
    this.formControl = new FormControl(null);
    console.log('field', this.field());
  }
  selectChange(option: any) {
     const search: { [key: string]: SearchDetails } =
    {
    [ this.field()?.name!]: {
       equalValue: option?.value,
          }
     }
   this._store.setSearchDataAttribute(search);
    console.log(option?.value);
  }
  clearSelect(ev: MouseEvent): void {
    ev.stopPropagation(); // prevent opening the panel
    ev.preventDefault();

    this.formControl.setValue(null, { emitEvent: true });
    this.formControl.markAsDirty();
    this.formControl.updateValueAndValidity();

    // If downstream logic depends on (selectionChange), fire a synthetic event:
    if (typeof this.selectChange === 'function') {
      this.selectChange({ value: null } as MatSelectChange);
    }
  }
}

import { AfterViewInit, Component, DestroyRef, inject, input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';

import { AdvancedSearchService } from 'src/app/shared/services/advanced-serach.service';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { Field, FieldType } from '../../models/dashboard-config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, EMPTY, filter, Observable, switchMap, tap } from 'rxjs';

import { DashboardStore } from '../../services/dashboard-state.service';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';

@Component({
  selector: 'input-text',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  standalone: true,
  imports: [
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
export class InputTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
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
      this.formControl.reset("", { emitEvent: false });
    });

    this.formControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(1000),
        filter((value: any) => typeof value === 'string'),
        tap((value: string) => {
          const search: { [key: string]: SearchDetails } =
           {
                  [this.field()?.name!]: {
                    likeValue: value
                  }
           }
          this._store.setSearchDataAttribute(search);
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {

    this.formControl = new FormControl("");
    console.log('field', this.field());
  }

}

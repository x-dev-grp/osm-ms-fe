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
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { Field, FieldType } from '../../models/dashboard-config';
import { SearchData } from 'src/app/shared/models/advanced-search/searchData';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, EMPTY, filter, Observable, switchMap, tap } from 'rxjs';
import { SearchResponse } from 'src/app/shared/models/advanced-search/searchResponse';
import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { OptionsScrollDirective } from 'src/app/shared/directives/options-scroll.directive';
import { DashboardStore } from '../../services/dashboard-state.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';

@Component({
  selector: 'slide',
  templateUrl: './slide-field.component.html',
  styleUrls: ['./slide-field.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
  
    SharedModule,
  ]
})
export class SlideComponent implements OnInit,AfterViewInit{
  readonly destroyRef = inject(DestroyRef);
  ngAfterViewInit(): void {

    this._store.resetFields$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.toggleControl.reset(false);
    });
   this.toggleControl.valueChanges.pipe(
    takeUntilDestroyed(this.destroyRef),
    tap(value=>{
      console.log(value)
      const search: { [key: string]: SearchDetails } = {
        [`${this.field()?.booleanAttributeName}`]: {
          equalValue: value
          }
        };
    this._store.setSearchDataAttribute(search);
    })
   ).subscribe()
   this.toggleControl.setValue(false);

  }
  _store = inject(DashboardStore);
  field = input.required<Field>();
  toggleControl: AbstractControl;
  
  ngOnInit(): void {
    this.toggleControl = new FormControl();
  }

}
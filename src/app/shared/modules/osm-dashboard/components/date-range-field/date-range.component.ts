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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { Field } from '../../models/dashboard-config';
import { DashboardStore } from '../../services/dashboard-state.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  standalone: true,
  providers: [provideNativeDateAdapter(), DatePipe],
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
export class DateRangeComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly destroyRef = inject(DestroyRef);
  _store = inject(DashboardStore);
  _date = inject(DatePipe);
  field = input.required<Field>();
  range: FormGroup;
  ngOnDestroy(): void {}
 
  

  ngAfterViewInit(): void {
    this._store.resetFields$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.range.reset({ start: null, end: null }, { emitEvent: false });
      });
  }
  onDateRangeClosed() {
    console.log('date range closed');
    let { start, end } = this.range.value;
    end?.setHours(23, 59, 59, 999);
    start?.setHours(0, 0, 0, 0);

    if (start && end) {
      const search: { [key: string]: SearchDetails } = {
        [this.field()?.valuePath ? this.field()?.valuePath! : this.field()?.name!]: {
          minValueOrEqual: this._date.transform(start, 'yyyy-MM-ddTHH:mm:ss')!,
          maxValueOrEqual: this._date.transform(end, 'yyyy-MM-ddTHH:mm:ss')!
        }
      };
      this._store.setSearchDataAttribute(search);
      return;
    }
    if (start && !end) {
      const search: { [key: string]: SearchDetails } = {
        [ this.field()?.name!]: {
          minValueOrEqual: this._date.transform(start, 'yyyy-MM-ddTHH:mm:ss')!
        }
      };
      this._store.setSearchDataAttribute(search);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {
    this.range = new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null)
    });
   
  }

}

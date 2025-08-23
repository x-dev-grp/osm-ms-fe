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
import { SharedModule } from 'src/app/shared/shared.module';
import { Field } from '../../models/dashboard-config';

import { DashboardStore } from '../../services/dashboard-state.service';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
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
export class SliderComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly destroyRef = inject(DestroyRef);
  _searchService = inject(AdvancedSearchService);
  _store = inject(DashboardStore);
  field = input.required<Field>();
  rangeNumber: FormGroup;

  ngOnDestroy(): void {}
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
  sliderValueChange() {
    console.log(this.rangeNumber.value);
    const { start, end } = this.rangeNumber.value;
    if ((start!=null && start!=undefined) && (end!=null && end!=undefined)) {
      const search: { [key: string]: SearchDetails } = {
        [this.field()?.name!]: {
          minValueOrEqual: start,
          maxValueOrEqual: end
        }
      };
      this._store.setSearchDataAttribute(search);
    }
  }


  ngAfterViewInit(): void {
    this._store.resetFields$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.rangeNumber.reset({
        start: this.field()?.sliderMinValue || 0,
        end: this.field()?.sliderMaxValue || 1000000
      }, { emitEvent: false });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {

    this.rangeNumber = new FormGroup({
      start: new FormControl<number | null>(this.field()?.sliderMinValue || 0),
      end: new FormControl<number | null>(this.field()?.sliderMaxValue || 1000000)
    });

    console.log('field', this.field());
  }

}

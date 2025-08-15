import { AfterViewInit, Component, DestroyRef, inject, input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatSortModule } from '@angular/material/sort';

import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { Field } from '../../models/dashboard-config';

import { provideNativeDateAdapter } from '@angular/material/core';
import { DateRangeComponent } from '../date-range-field/date-range.component';
import { SliderComponent } from '../slider-field/slider.component';
import { InputTextComponent } from '../text-field/text-input.component';
import { SelectComponent } from '../select-field/select.component';
import { AutoCompleteComponent } from '../auto-complete-field/auto-complete.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DashboardStore } from '../../services/dashboard-state.service';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';
import { SlideComponent } from '../slide-field copy/slide-field.component';

@Component({
  selector: 'dynamic-input',
  templateUrl: './dynamic-input.component.html',
  styleUrls: ['./dynamic-input.component.scss'],
  standalone: true,
  providers: [provideNativeDateAdapter(), DatePipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    SharedModule,
    DateRangeComponent,
    SliderComponent,
    InputTextComponent,
    SelectComponent,
    AutoCompleteComponent,
    SlideComponent
  ]
})
export class DynamicInput implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  field = input.required<Field>();
  _store=inject(DashboardStore)
  formControl: AbstractControl;
  ngOnDestroy(): void {}


  ngAfterViewInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
  }
  ngOnInit(): void {
    this.formControl = new FormControl(null);
    }

}

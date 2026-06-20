import { AfterViewInit, Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { Field } from '../../models/dashboard-config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { DashboardStore } from '../../services/dashboard-state.service';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';

@Component({
  selector: 'slide',
  templateUrl: './slide-field.component.html',
  styleUrls: ['./slide-field.component.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule]
})
export class SlideComponent implements OnInit, AfterViewInit {
  readonly destroyRef = inject(DestroyRef);
  ngAfterViewInit(): void {
    this._store
      .resetFields$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toggleControl.reset(false);
      });
    this.toggleControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((value) => {
          console.log(value);
          const search: { [key: string]: SearchDetails } = {
            [`${this.field()?.booleanAttributeName}`]: {
              equalValue: value
            }
          };
          this._store.setSearchDataAttribute(search);
        })
      )
      .subscribe();
    this.toggleControl.setValue(false);
  }
  _store = inject(DashboardStore);
  field = input.required<Field>();
  toggleControl: AbstractControl;

  ngOnInit(): void {
    this.toggleControl = new FormControl();
  }
}

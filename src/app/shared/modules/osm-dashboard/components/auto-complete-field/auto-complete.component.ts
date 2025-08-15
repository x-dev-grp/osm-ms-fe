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
  selector: 'auto-complete',
  templateUrl: './auto-complete.component.html',
  styleUrls: ['./auto-complete.component.scss'],
  standalone: true,
  providers: [provideNativeDateAdapter(), DatePipe],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    OptionsScrollDirective
  ]
})
export class AutoCompleteComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly destroyRef = inject(DestroyRef);
  _searchService = inject(AdvancedSearchService);
  _store = inject(DashboardStore);
  field = input.required<Field>();
  formControl: AbstractControl;
  autoCompleteOptions: SearchResponse;
  autoCompleteDefaultCriteria: SearchData = new SearchData();
  ngOnDestroy(): void {}

  setupAutocompleteListener(): void {
    this.formControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(1000),
        filter((value: any) => typeof value === 'string'),
        switchMap((value: string) => {
          console.log(value);
          const searchs: Record<string, any> = {};
          if(this.field().autoCompleteFilterAttributes && this.field()?.autoCompleteFilterAttributes?.length){
          this.field().autoCompleteFilterAttributes?.forEach((attr) => {
            searchs[attr] = { likeValue: value };
          });
        }else{
          searchs[this.field()?.valuePath!] = { likeValue: value };
        }
          this.autoCompleteDefaultCriteria = {
            ...this.autoCompleteDefaultCriteria,
            searchData: {
              ...this.autoCompleteDefaultCriteria.searchData,
              searchs: [
                {
                  operation: SearchOperation.OR,
                  search: searchs
                }
              ]
            }
          };
          return this.fetchAutocompleteOptions(false);
        })
      )
      .subscribe();
  }
  ngAfterViewInit(): void {
      this.setupAutocompleteListener();

    this._store.resetFields$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.formControl.reset(null, { emitEvent: false });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {

      console.log('auto-complete field');
      if (this.field().autoCompleteDefaultCriteria) this.autoCompleteDefaultCriteria = this.field().autoCompleteDefaultCriteria!;
      this.fetchAutocompleteOptions(false).subscribe();

    this.formControl = new FormControl(null);
  }
  autoCompleteSelect(event: any) {
    console.log(event);
    const search: { [key: string]: SearchDetails } = {
      [`${this.field()?.name}.id`]: {
        equalValue: event?.id.toString()
        }
      };
      this._store.setSearchDataAttribute(search);
  }

  getValue(path: string, object: any): any {
    return path?.split('.')?.reduce((acc, key) => acc && acc[key], object);
  }

  fetchAutocompleteOptions(scroll: boolean): Observable<SearchResponse> {
    const url = this.field().getOptionsUrl;
    console.log(url);
    if (!url) {
      console.warn('No options URL provided for autocomplete field');
      return EMPTY;
    }
    if (!scroll) {
      this.autoCompleteDefaultCriteria.page = 0;
    }
    return this._searchService.search(this.autoCompleteDefaultCriteria, url).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response: SearchResponse) => {
        this.autoCompleteOptions = {
          ...response,
          data: scroll ? [...this.autoCompleteOptions?.data, ...response.data] : response.data
        };

        console.log(response);
      }),
      catchError((err) => {
        console.error('Autocomplete fetch failed:', err);
        return EMPTY;
      })
    );
  }
  scroll(event: any) {
    console.log(event);
    if (this.autoCompleteOptions.totalPages > this.autoCompleteOptions.page) {
      this.autoCompleteDefaultCriteria.page = this.autoCompleteDefaultCriteria.page! + 1;
      this.fetchAutocompleteOptions(true).subscribe();
    }
  }

  displayWith = (option: any): string => {
    return this.getValue(this.field()?.valuePath!, option);
  };
}

import { AfterViewInit, Component, DestroyRef, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../demo/shared/shared.module';
import { DynamicInput } from '../osm-dashboard/components/dynamic-input/dynamic-input.component';
import { OptionsScrollDirective } from '../../directives/options-scroll.directive';
import { SearchOperation } from '../../models/advanced-search/searchOperation';
import { SearchData } from '../../models/advanced-search/searchData';
import { SearchResponse } from '../../models/advanced-search/searchResponse';
import { catchError, debounceTime, EMPTY, filter, Observable, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdvancedSearchService } from '../../services/advanced-serach.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'supplierList',
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
    DynamicInput,
    OptionsScrollDirective,
    TranslateModule
  ],
  templateUrl: './supplier.component.html',
  styleUrl: './supplier.component.scss',
  standalone: true
})
export class SupplierComponent implements OnInit, AfterViewInit, OnChanges {
  formControl = input.required<any>();
  selected = output<any>();
  readonly destroyRef = inject(DestroyRef);
  _searchService = inject(AdvancedSearchService);
  translate = inject(TranslateService);
  autoCompleteOptions: SearchResponse;
  searchData: SearchData = {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {isDeleted:{
          equalValue:false
        },},
      searchs: []
    }
  };

  ngAfterViewInit(): void {
    this.setupAutocompleteListener();
  }

  setupAutocompleteListener(): void {
    this.formControl()
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(1000),
        filter((value: any) => typeof value === 'string'),
        switchMap((value: string) => {
          console.log(value);

          this.searchData = {
            ...this.searchData,
            searchData: {
              ...this.searchData.searchData,
              search: { isDeleted:{
                  equalValue:false
                },
                ...this.searchData.searchData?.search,
                'supplierInfo.name': {
                  likeValue: value
                }
              }
            }
          };
          return this.fetch(false);
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {}

  autoCompleteSelect(event: any) {
    this.selected.emit(event);
  }

  ngOnInit(): void {
    this.fetch(false).subscribe()
  }

  fetch(scroll: boolean): Observable<SearchResponse> {
    const url = 'production/suppliers_type';
    console.log(url);
    if (!url) {
      console.warn('No options URL provided for autocomplete field');
      return EMPTY;
    }
    if (!scroll) {
      this.searchData.page = 0;
    }
    return this._searchService.search(this.searchData, url).pipe(
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
      this.searchData.page = this.searchData.page! + 1;
      this.fetch(true).subscribe();
    }
  }

  displayWith = (option: any): string | null => {
    if (option) {
      return option?.supplierInfo.name + ' ' + option?.supplierInfo.name;
    }
    return null;
  };
}

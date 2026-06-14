import { SearchData } from 'src/app/shared/models/advanced-search/searchData';
import { SearchResponse } from '../../../models/advanced-search/searchResponse';
import {  Field, FieldType } from '../models/dashboard-config';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { computed, effect, inject } from '@angular/core';
import { AdvancedSearchService } from 'src/app/shared/services/advanced-serach.service';
import { catchError, defer, EMPTY, finalize, Subject, switchMap, tap } from 'rxjs';
import { SearchDetails } from 'src/app/shared/models/advanced-search/searchDetails';
import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { SearchModel } from 'src/app/shared/models/advanced-search/searchModel';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { BaseService } from 'src/app/shared/services/base.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import {  TranslateService } from '@ngx-translate/core';
export interface DashboardState {
  endpoint: string;
  data: SearchResponse;
  loading: boolean;
  actionLoading:boolean;
  exportPdfLoading: boolean;
  exportExcelLoading: boolean;
  searchData: SearchData;
  allFields: Field[];
  filterFields: { field: Field; checked: boolean }[];
  exportFields: { field: Field; checked: boolean }[];
  dataTableFields: Field[];
  resetFieldsSubject: Subject<void>;
  searchTrigger$: Subject<any>;
  fileName:string;

}

const initialState: DashboardState = {
  endpoint: '',
  data: {
    total: 0,
    data: [],
    totalPages: 0,
    page: 0,
    totals:new Map<string, number>()
  },
  loading: false,
  actionLoading:false,
  exportPdfLoading: false,
  exportExcelLoading: false,
  searchData: new SearchData(),
  allFields: [],
  filterFields: [],
  exportFields: [],
  dataTableFields: [],
  resetFieldsSubject: new Subject<void>(),
  searchTrigger$: new Subject<SearchData>(),
  fileName:'default',

};

export const DashboardStore = signalStore(

  withState(initialState),
  withComputed((store) => ({
    data: store.data,
    loading: store.loading,
    actionLoading:store.actionLoading,
    exportPdfLoading: store.exportPdfLoading,
    exportExcelLoading: store.exportExcelLoading,
    searchData: store.searchData,
    allFields: store.allFields,
    filterFields: store.filterFields,
    checkedFilterFields: computed(() => store.filterFields().filter((field) => field.checked)),
    checkedExportFields: computed(() => store.exportFields().filter((field) => field.checked)),
    exportFields: store.exportFields,
    dataTableFields: store.dataTableFields,
    endpoint: store.endpoint,
    resetFields$:  store.resetFieldsSubject,
    searchTrigger$: store.searchTrigger$,
    fileName:store.fileName,
  })),
  withMethods((store, _searchService = inject(AdvancedSearchService),_http=inject(HttpClient),_baseService=inject(BaseService),translate=inject(TranslateService)) => {
    const getValue= (path: string | undefined, object: any): any => {
        return path?.split('.')?.reduce((acc, key) => acc && acc[key], object);
      };
    return {
      initialize(endpoint: string, allFields: Field[], searchData?: SearchData,fileName?:string,filterTenant?:boolean): void {
        patchState(store, {
          endpoint: endpoint,
          allFields: allFields,
          filterFields: allFields.filter((field) => field.filterable).map((field) => ({ field, checked: field.defaultFilter ?? false })),
          exportFields: allFields.filter((field) => field.exportable).map((field) => ({ field, checked: true })),
          dataTableFields: allFields.filter((field) => field.dataTable),
          fileName:fileName ?? 'default'
        });
        let resolvedSearchData = searchData ?? store.searchData();
        if (filterTenant != null) {
          resolvedSearchData = { ...resolvedSearchData, filterTenant };
        }
        patchState(store, { searchData: resolvedSearchData });
        const toCalculateTotal:string[]=allFields.filter( field=>field.dataTable &&  field.calculateTotal).map(f=>f.name);
        if(toCalculateTotal?.length>0){
          resolvedSearchData = { ...resolvedSearchData, toCalculateTotal };
          patchState(store, { searchData: resolvedSearchData });
        }


      },
      export(exportType: string) {
        exportType=='pdf'?this.setExportPdfLoading(true):this.setExportExcelLoading(true);
        const fieldsToExport:{
                 name: string;
                 label: string;
                 enumValue: boolean;
                 enumValues: { [key: string]: string };
               } []= store.checkedExportFields().filter(field=>!field.field.flattedList).map((field:any) =>{
            return {
                name: field.field.fieldType==FieldType.autocomplete? field.field.name+"."+field.field.valuePath : field.field.name,
                label: field.field?.exportLabel?? (field.field?.labelTranslatePath ? translate.instant(field.field?.labelTranslatePath):field.field.label),
                enumValue : field.field.attributeType== 'enum' ? true : false,
                enumValues:  field.field.options?.reduce((acc:any, option:any) => {
                    acc[option.value] = option?.labelTranslatePath? translate.instant(option?.labelTranslatePath):option?.name;
                    return acc;
                }, {}) || null
            }
        });
        if(!fieldsToExport || fieldsToExport?.length<=0){
            return ;
        }
        let exportDetails:any={
            fieldDetails:fieldsToExport,
            fileName:translate.instant(store.fileName()),
            searchData:store.searchData()
        }
        const flattedAttributes:any [] = store.checkedExportFields().filter(field=>field.field.flattedList==true).map((field:{ field: Field; checked: boolean }) =>{
          return {
            collectionPath: field.field?.name,
            nameField:field.field?.nameField,
            valueField: field.field?.valueField,
            columnPrefix:field.field?.columnPrefix,
          }
        });
        if(flattedAttributes.length>0){
          exportDetails={
            ...exportDetails,
            collectionFields:flattedAttributes
          }
        }
        return _http.post(`${environment.apiUrl}/api/${store.endpoint()}/export/${exportType}`,exportDetails,{
            responseType: 'blob',
            observe: 'response'
          }).pipe(
          tap((response) => {
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'export.pdf';

            if (contentDisposition) {
              const match = contentDisposition.match(/filename="?(.+)"?/);
              if (match) {

                filename = match[1]?.slice(0,-1);
              }
            }

            const blob = new Blob([response.body!], {
              type: response.body!.type
            });

            saveAs(blob, filename);
            exportType=='pdf'?this.setExportPdfLoading(false):this.setExportExcelLoading(false);
          }),
          catchError((error) => {
            console.error('Error exporting PDF:', error);
            exportType=='pdf'?this.setExportPdfLoading(false):this.setExportExcelLoading(false);
            return EMPTY;
          })
        ).subscribe();

      },
      fetchData() {
         console.log('New search triggered with:', store.searchData());
         this.setLoading(true);

      _searchService.search(store.searchData(), store.endpoint())
             .pipe(
                tap((response:SearchResponse) => {
                  console.log('Data fetched:', response);
                  const totalsObj = response.totals ?? {};
                  const totalsMap = new Map<string, number>(
                    Object.entries(totalsObj).map(([k, v]) => [k, Number(v) || 0])
                  );
                  response={...response,totals:totalsMap}
                  this.setData(response);
                  this.setLoading(false);
                }),
                catchError((error) => {
                  console.error('Error fetching data:', error);
                  this.setLoading(false);
                  return EMPTY;
                }),
                finalize(() => {
                  this.setLoading(false);
                })
              ).subscribe();

      },

      removeItem(id:string,path:string){
        this.setActionLoading(true);
        _baseService.deleteItem(path,id).pipe(
          tap((response) => {
            console.log('item deleted');
            this.setActionLoading(false);
            this.fetchData()
          }),
          catchError((error) => {
            console.error('Error deleting item:', error);
            this.setActionLoading(false);
            return EMPTY;
          }),
          finalize(() => {
            this.setActionLoading(false);
          })
        ).subscribe()
      },
      setLoading: (loading: boolean) => {
        patchState(store, { loading });
      },

      setActionLoading: (actionLoading: boolean) => {
        patchState(store, { actionLoading });
      },
        setExportPdfLoading: (loading: boolean) => {
            patchState(store, { exportPdfLoading: loading });
        },
        setExportExcelLoading: (loading: boolean) => {
            patchState(store, { exportExcelLoading: loading });
        },
      setData: (data: SearchResponse) => {
        patchState(store, { data });
        const collator = new Intl.Collator(['fr', 'en'], {
          sensitivity: 'base',
          numeric: true,
          ignorePunctuation: true,
        });


        // 1) Start from the base columns (those marked dataTable but NOT flatted parents)
        const baseCols = store
          .allFields()
          .filter((f: Field) => f.dataTable && !f.flattedList);

        // 2) Build flatted children (new objects) from the first row that has values
        const flatParents = store.allFields().filter((f: Field) => f.flattedList === true);

        const flatChildren: Field[] = flatParents.flatMap((parent: Field) => {
          const rowWithValues = data.data.find(
            (item: any) => item[parent.name] != null && item[parent.name]?.length > 0
          );
          if (!rowWithValues) return [];

          // safe getter
          const safeGet = (path?: string | null, obj?: any) => {
            if (!path || obj == null) return '';
            return path.split('.').reduce((acc: any, k: string) => (acc == null ? acc : acc[k]), obj);
          };

          return (rowWithValues[parent.name] as any[]).map((itemData: any, index: number) => ({
            ...parent,
            // override identity & display
            name: safeGet(parent.nameField, itemData),
            label: safeGet(parent.nameField, itemData),
            flattedItemIndex: index,
            dataTable: true,
            sortable:true,
          }));
        });

        // 3) Optional: de-dupe by label (use Set) to avoid duplicates on repeated calls

        const sorted = [...flatChildren].sort((a, b) =>
          collator.compare(a?.name ?? '', b?.name ?? '')
        );

        const seen = new Set<string>();
        const deduped = [...baseCols, ...sorted].filter(col => {
          const key = (col.label ?? col.name ?? '').trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        patchState(store, { dataTableFields: deduped });
      },
      setSearchData: (searchData: SearchData) => {
        patchState(store, { searchData });
      },
      setSearchDataAttribute: (attribute: { [key: string]: SearchDetails }) => {
        const currentSearchData = store.searchData();
        const searchs = currentSearchData.searchData?.searchs ?? [];

        // Determine the new list of searches
        const updatedSearchs: SearchModel[] =
          searchs.length > 0
            ? [
                {
                  ...searchs[0],
                  search: {
                    ...searchs[0].search,
                    ...attribute
                  }
                }
              ]
            : [
                {
                  search: { ...attribute },
                  operation: SearchOperation.AND
                }
              ];
              const keys = Object.keys(attribute);
              const key = keys[0];
              const operationKeys= Object.keys(attribute[key])
              const op = operationKeys[0];
              if((op=="equalValue" || op=="likeValue")  && !attribute[key][op]){
                if (updatedSearchs[0].search) {
                  delete updatedSearchs[0].search[key];
                }
              }
        const newSearchData = {
          ...currentSearchData,
          searchData: {
            ...currentSearchData.searchData,
            searchs: updatedSearchs
          }
        };

        patchState(store, { searchData: newSearchData });
      },
      resetSearchData: () => {
        const currentSearchData = store.searchData();
        const newSearchData = {
          ...currentSearchData,
          searchData: {
            ...currentSearchData.searchData,
            searchs: []
          }
        };
        patchState(store, { searchData: newSearchData });
        store.resetFieldsSubject().next();
      },
      setAllFields: (allFields: Field[]) => {
        patchState(store, { allFields });
      },

      setDataTableFields: (dataTableFields: Field[]) => {
        patchState(store, { dataTableFields });
      },

      setExportableField(field: Field, checked: boolean): void {
        const updatedFields = [...store.exportFields()];
        const index = updatedFields.findIndex((f) => f.field.name === field.name);

        if (index !== -1) {
          updatedFields[index] = { ...updatedFields[index], checked };
          patchState(store, { exportFields: updatedFields });
        }
      },

      setFilteredField(field: Field, checked: boolean): void {
        const updatedFields = [...store.filterFields()];
        const index = updatedFields.findIndex((f) => f.field.name === field.name);

        if (index !== -1) {
          updatedFields[index] = { ...updatedFields[index], checked };
          patchState(store, { filterFields: updatedFields });
        }
      },
        setExportField(field: Field, checked: boolean): void {
            const updatedFields = [...store.exportFields()];
            const index = updatedFields.findIndex((f) => f.field.name === field.name);
            if (index !== -1) {
                updatedFields[index] = { ...updatedFields[index], checked };
                patchState(store, { exportFields: updatedFields });
            }
        },
      setAllFilterField(checked: boolean): void {
        const updatedFields = [...store.filterFields()];
        updatedFields.forEach((f) => {
          f.checked = checked;
        });
        patchState(store, { filterFields: updatedFields });
      },
        setAllExportField(checked: boolean): void {
            const updatedFields = [...store.exportFields()];
            updatedFields.forEach((f) => {
            f.checked = checked;
            });
            patchState(store, { exportFields: updatedFields });
        },
      isAllFilterFieldsChecked(): boolean {
        return !store.filterFields().some((f) => !f.checked);
      },
      isAllExportFieldsChecked(): boolean {
        return !store.exportFields().some((f) => !f.checked);
        },
      setEndpoint: (endpoint: string) => {
        patchState(store, { endpoint });
      },
      setPage: (page: number) => {
        const currentSearchData = store.searchData();
        const newSearchData = { ...currentSearchData, page };
        patchState(store, { searchData: newSearchData });
      },
      setPageSize: (size: number) => {
        const currentSearchData = store.searchData();
        const newSearchData = { ...currentSearchData, size, page: 0 };
        patchState(store, { searchData: newSearchData });
      },
      setSort: (sort: string, order: string) => {
        const currentSearchData = store.searchData();
        const newSearchData = { ...currentSearchData, sort, order };
        patchState(store, { searchData: newSearchData });
      }
    };
  }),
  withHooks({
    onInit: (store) => {
      effect(() => {
        console.log('DashboardStore changed');
        const currentSearchData = store.searchData();
        console.log('currentSearchData', currentSearchData);
        console.log('store.endpoint()', store.endpoint());
        if (store.endpoint() && currentSearchData) {
          console.log('Fetching data...');
          store.fetchData();
        //  store.searchTrigger$().next(currentSearchData);
        }
      });

    }
  })
);

import { Pipe, PipeTransform } from '@angular/core';
import { BaseType } from '../../../shared/models/base-type';
import { SupplierType } from '../../../shared/models/supplier-type';

type FilterableItem = BaseType | SupplierType;

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: FilterableItem[], searchText: string, displayField: string): FilterableItem[] {
    if (!items || !searchText) {
      return items;
    }

    searchText = searchText.toLowerCase();
    return items.filter((item) => {
      const value = this.getNestedValue(item, displayField);
      return value?.toString().toLowerCase().includes(searchText);
    });
  }

  private getNestedValue(obj: FilterableItem, path: string): string | null {
    return (
      path
        .split('.')
        .reduce((current, key) => {
          if (current === null || current === undefined) return null;
          return (current as any)[key];
        }, obj as any)
        ?.toString() || null
    );
  }
}

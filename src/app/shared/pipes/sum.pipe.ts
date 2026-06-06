import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sum',
  standalone: true
})
export class SumPipe implements PipeTransform {
  transform(items: any[], field: string): number {
    if (!items || !field) return 0;
    return items.reduce((sum, item) => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return sum + (value || 0);
    }, 0);
  }
}

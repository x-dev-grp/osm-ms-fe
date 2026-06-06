import { Pipe, PipeTransform } from '@angular/core';
import { PlanningItem } from '../models/planningDTOS';

@Pipe({
  name: 'filterLot',
  standalone: true,
  pure: false // pour que le pipe réagisse à chaque frappe
})
export class FilterLotPipe implements PipeTransform {
  transform(items: any, searchTerm: string): any {
    if (!items || !searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter((item: { data: PlanningItem; }) => {
      const lot = ((item.data as PlanningItem).lotNumber?.toString().toLowerCase() || '');
      return lot.includes(term);
    });
  }
}

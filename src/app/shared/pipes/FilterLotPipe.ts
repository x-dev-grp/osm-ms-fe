import { Pipe, PipeTransform } from '@angular/core';
import { BoardItem, GlobalLot, PlanItemType, PlanningItem } from '../models/planningDTOS';

export function boardItemMatchesSearch(item: BoardItem, rawTerm: string): boolean {
  const term = rawTerm?.trim().toLowerCase();
  if (!term) {
    return true;
  }

  if (item.type === PlanItemType.LOT) {
    const data = item.data as PlanningItem;
    const supplier = data.supplier
      ? `${data.supplier.name ?? ''} ${data.supplier.lastname ?? ''}`.trim().toLowerCase()
      : '';
    const haystack = [
      data.lotNumber,
      data.deliveryNumber?.toString(),
      data.id,
      data.globalLotNumber,
      supplier,
      data.region,
      data.oliveVariety,
      data.oliveType,
      data.parcel,
      data.matriculeCamion
    ];

    return haystack.some((value) => value?.toString().toLowerCase().includes(term));
  }

  const data = item.data as GlobalLot;
  return (
    data.globalLotNumber.toLowerCase().includes(term) ||
    data.childLotNumbers.some((lot) => lot.toLowerCase().includes(term))
  );
}

@Pipe({
  name: 'filterLot',
  standalone: true,
  pure: true
})
export class FilterLotPipe implements PipeTransform {
  transform(items: BoardItem[] | null | undefined, searchTerm: string): BoardItem[] {
    if (!items?.length) {
      return items ?? [];
    }

    const term = searchTerm?.trim();
    if (!term) {
      return items;
    }

    return items.filter((item) => boardItemMatchesSearch(item, term));
  }
}

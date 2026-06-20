import { MatTableDataSource } from '@angular/material/table';

export type TableSortDirection = 'asc' | 'desc';

export function getCreatedDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function compareByCreatedDate(a?: string | null, b?: string | null, direction: TableSortDirection = 'desc'): number {
  const cmp = getCreatedDateTimestamp(a) - getCreatedDateTimestamp(b);
  return direction === 'asc' ? cmp : -cmp;
}

export function sortRowsByCreatedDate<T extends { createdDate?: string | null }>(rows: T[], direction: TableSortDirection = 'desc'): T[] {
  return [...rows].sort((a, b) => compareByCreatedDate(a.createdDate, b.createdDate, direction));
}

export function configureMatTableCreatedDateSort<T>(dataSource: MatTableDataSource<T>): void {
  dataSource.sortingDataAccessor = (item, property) => {
    if (property === 'createdDate') {
      return getCreatedDateTimestamp((item as Record<string, unknown>)['createdDate'] as string | undefined);
    }

    const value = (item as Record<string, unknown>)[property];
    if (value == null) {
      return '';
    }

    return typeof value === 'string' || typeof value === 'number' ? value : String(value);
  };
}

export function toggleSortDirection(direction: TableSortDirection): TableSortDirection {
  return direction === 'desc' ? 'asc' : 'desc';
}

export interface PublicHoliday {
  id?: string;
  date?: string;
  nameFr: string;
  nameAr?: string;
  paid?: boolean;
  legal?: boolean;
  recurring?: boolean;
  effectiveYear?: number;
}

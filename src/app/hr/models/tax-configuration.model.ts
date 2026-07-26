export interface TaxConfiguration {
  id?: string;
  fiscalYear?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  description?: string;
  version?: number;
  active?: boolean;
}

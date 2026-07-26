export interface LegalRule {
  id?: string;
  code?: string;
  category?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  value?: number;
  configurationJson?: string;
  calculationMethod?: string;
  legalReference?: string;
  description?: string;
  version?: number;
  active?: boolean;
}

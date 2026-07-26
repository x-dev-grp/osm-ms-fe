export interface SalaryComponent {
  id?: string;
  code?: string;
  labelFr: string;
  labelAr?: string;
  type?: string;
  calculationType?: string;
  taxable?: boolean;
  cnssApplicable?: boolean;
  active?: boolean;
  sortOrder?: number;
}

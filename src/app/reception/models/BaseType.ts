

export interface BaseType {
  id?: number;
  name: string;
  description?: string;
  type?: TypeCategory; // à définir comme enum si besoin
}
export enum TypeCategory {
  SUPPLIER_TYPE = 'SUPPLIER_TYPE',
  REGION = 'REGION',
  VARIETY = 'VARIETY',
}

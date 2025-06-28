// src/app/modules/finance/oil-credits/oil-credit.model.ts

/**
 * Model representing an oil credit entry in the finance microservice.
 */
export enum UnitType {
  KG = 'KG',
  L = 'L'
}

export enum CreditState {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OilCredit {
  id?: string;
  emballage: string;
  quantity: number;
  unit: UnitType;
  oil_type: string; // UUID as string
  destinataire: string; // UUID as string
  transaction_id_in?: string; // UUID as string, optional
  transaction_id_out?: string; // UUID as string, optional
  creditState: CreditState;

  // BaseEntity fields (inherited from BaseEntity)
  createdDate?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}


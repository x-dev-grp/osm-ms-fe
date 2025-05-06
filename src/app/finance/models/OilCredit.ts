// src/app/modules/finance/oil-credits/oil-credit.model.ts

/**
 * Model representing an oil credit entry in the finance microservice.
 */
export enum UnitType {
  KG = 'KG',
  L = 'L'
}

export interface OilCredit {
  id?: string;
  credit_date: string; // ISO date string (yyyy-MM-dd)
  citerne_pile: string;
  emballage: string;
  quantity: number;
  unit: UnitType;
  destinataire: string;
}


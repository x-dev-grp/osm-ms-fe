// src/app/models/oil-container.model.ts

export interface OilContainer {
  /** UUID (from BaseEntity) */
  id: string;
  /** Tenant ID (from BaseEntity) */
  tenantId: string;
  /** Logical delete flag (from BaseEntity) */
  isDeleted: boolean;

  /** e.g. "1 L Glass Bottle" */
  name: string;
  lotNumber: string;
  /** Optional longer description */
  description?: string;

  /** capacity in liters (e.g. 1.00, 5.00) */
  capacityInLiters: number;
  /** how many units in stock */
  stockQuantity: number;
  /** e.g. "Glass", "Plastic" */
  material?: string;

  /** cost to acquire each empty container */
  buyPrice: number;
  /** price charged per filled container */
  sellingPrice: number;

  /** reorder when stock ≤ this */
  reorderThreshold?: number;
  /** quantity to order when threshold is hit */
  reorderQuantity?: number;

  /** SKU for POS */
  sku?: string;
  /** barcode string */
  barcode?: string;

  /** e.g. "WH1-A3-B2" */
  storageLocationCode?: string;
  /** image URL for catalog */
  imageUrl?: string;

  /** enable/disable without deletion */
  active: boolean;
  /** e.g. "FDA food-grade" */
  certification?: string;
}

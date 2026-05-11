export type ProductType = 'VRAC' | 'NON_VRAC';
export type ProductUnitOfMeasure = 'L' | 'KG' | 'BOTTLE' | 'CARTON';

export interface Product {
  id?: string;
  name: string;
  code?: string;
  type: ProductType;
  category?: string;
  unitOfMeasure?: ProductUnitOfMeasure | string;
  description?: string;
  grade?: string;
  origin?: string;
  harvestCampaign?: string;
  volume?: number;
  packagingType?: string;
  barcode?: string;
  unitsPerCarton?: number;
  cartonsPerPallet?: number;
  unitesParCols?: number;
  colisParPalette?: number;
  netWeight?: number;
  grossWeight?: number;
  brand?: string;
  density?: number;
  storageUnit?: string;
  actif?: boolean;
  createdDate?: string;
}

export type SKU = Product;

export function productDisplayName(product: Pick<Product, 'name' | 'code'> | null | undefined): string {
  return product?.name || product?.code || '';
}

export function productTypeLabel(type?: ProductType): string {
  return type === 'VRAC' ? 'Vrac' : 'Non vrac';
}

export function productUnitsPerCarton(product: Product | null | undefined): number | undefined {
  return product?.unitsPerCarton ?? product?.unitesParCols;
}

export function productCartonsPerPallet(product: Product | null | undefined): number | undefined {
  return product?.cartonsPerPallet ?? product?.colisParPalette;
}

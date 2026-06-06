export interface OilContainer {
  id?: string;
  createdDate?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  description?: string;
  name: string;
  capacityInLiters: number;
  stockQuantity: number;
  buyPrice: number  ;
  sellingPrice: number;
  active: boolean;
}

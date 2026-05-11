import {BomLine} from "./BomLine";

export interface Bom {
  id?: string;
  productId: string;
  productName?: string;
  skuId?: string;
  skuCode?: string;
  version: string;
  lines: BomLine[];
  createdDate?: string;
}

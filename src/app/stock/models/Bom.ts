import {BomLine} from "./BomLine";

export interface Bom {
  id?: string;
  productId: string;
  productName?: string;
  skuId?: string;
  skuCode?: string;
  version: string;
  active?: boolean;
  lines: BomLine[];
  createdDate?: string;
  publicCode?: string;
  qrHex?: string;
  qrUrl?: string;
  qrImageBase64?: string;
}

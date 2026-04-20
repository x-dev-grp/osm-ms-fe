import {BomLine} from "./BomLine";

export interface Bom {
  id?: string;
  skuId: string;
  skuCode?: string;
  version: string;
  lines: BomLine[];
  createdDate?: string;
}

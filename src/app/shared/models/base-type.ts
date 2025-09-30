import {TypeCategory} from "./type-category.enum";

export interface BaseType {
  type: TypeCategory;         // This should match the discriminator value (e.g., "region")
  id?: string;
  name: string;
  externalId?: string;
  description: string;

}

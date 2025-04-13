import { TypeCategory } from '../../osm/models/type-category.enum';

export interface BaseType {
  type: TypeCategory;         // This should match the discriminator value (e.g., "region")
  id?: string;
  name: string;
  description: string;

}

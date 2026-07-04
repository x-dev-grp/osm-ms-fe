import { TypeCategory } from './type-category.enum';

export interface BaseType {
  type: TypeCategory;
  id?: string;
  name: string;
  description: string;
}

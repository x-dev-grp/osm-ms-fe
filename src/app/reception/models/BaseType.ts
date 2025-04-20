import { TypeCategory } from '../../shared/models/type-category.enum';

export interface BaseType {
  id?: number;
  name: string;
  description?: string;
  type?: TypeCategory; // à définir comme enum si besoin
}

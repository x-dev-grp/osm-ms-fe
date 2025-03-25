export enum TypeCategory {
  WASTETYPE = "WASTETYPE",
  REGION = "REGION",
  SUPPLIERTYPE = "SUPPLIERTYPE",
  OLIVEVARIETY ="OLIVEVARIETY",
}

// Helper function to find the enum by its value
export function typeCategoryFromValue(value: string): TypeCategory {
  for (const category in TypeCategory) {
    if (TypeCategory[category as keyof typeof TypeCategory] === value) {
      return value as TypeCategory;
    }
  }
  throw new Error(`Unknown type: ${value}`);
}

/**
 * Customer categories for business classification
 * Mirrors the backend CustomerCategory enum
 */
export enum CustomerCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS'
}

/**
 * Helper function to get display labels for customer categories
 * Note: This function should be used with translation keys in templates
 * For translated labels, use the translation service directly in templates
 */
export function getCustomerCategoryLabel(category: CustomerCategory): string {
  switch (category) {
    case CustomerCategory.INDIVIDUAL:
      return 'CUSTOMERS.CATEGORIES.INDIVIDUAL';
    case CustomerCategory.BUSINESS:
      return 'CUSTOMERS.CATEGORIES.BUSINESS';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get all customer categories with their translation keys
 */
export function getCustomerCategories(): Array<{value: CustomerCategory, label: string}> {
  return [
    { value: CustomerCategory.INDIVIDUAL, label: 'CUSTOMERS.CATEGORIES.INDIVIDUAL' },
    { value: CustomerCategory.BUSINESS, label: 'CUSTOMERS.CATEGORIES.BUSINESS' }
  ];
} 
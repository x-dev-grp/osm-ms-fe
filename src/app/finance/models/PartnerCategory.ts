/**
 * Customer categories for business classification
 * Mirrors the backend CustomerCategory enum
 */
export enum PartnerCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS'
}

/**
 * Helper function to get display labels for customer categories
 * Note: This function should be used with translation keys in templates
 * For translated labels, use the translation service directly in templates
 */
export function getCustomerCategoryLabel(category: PartnerCategory): string {
  switch (category) {
    case PartnerCategory.INDIVIDUAL:
      return 'CUSTOMERS.CATEGORIES.INDIVIDUAL';
    case PartnerCategory.BUSINESS:
      return 'CUSTOMERS.CATEGORIES.BUSINESS';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get all customer categories with their translation keys
 */
export function getCustomerCategories(): Array<{value: PartnerCategory, label: string}> {
  return [
    { value: PartnerCategory.INDIVIDUAL, label: 'CUSTOMERS.CATEGORIES.INDIVIDUAL' },
    { value: PartnerCategory.BUSINESS, label: 'CUSTOMERS.CATEGORIES.BUSINESS' }
  ];
}

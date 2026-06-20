import { PaymentMethod } from './financial-transaction.model';

export interface Expense {
  id?: string;
  invoiceRef?: string; // facture or null
  purchaseNature?: string; // nature d'achat
  amount: number; // somme or montant
  object?: string; // objet for non-invoiced
  vendor?: string; // Vendor or supplier
  category?: ExpenseCategory; // Expense category
  paymentMethod?: PaymentMethod; // Cash, Cheque, Transfer, etc.
  status?: 'Pending' | 'Paid' | 'Reimbursed'; // Expense status
  notes?: string; // Additional notes or comments
  receiptNumber?: string; // Receipt number (not file)
  createdBy?: string; // User who created the expense
  approved?: boolean; // Approval status
  approvalDate?: Date; // When approved
}
// src/app/shared/models/expense-category.ts
export enum ExpenseCategory {
  FUEL = 'FUEL',
  LUBRICANTS = 'LUBRICANTS',
  VEHICLE_PARTS_SERVICE = 'VEHICLE_PARTS_SERVICE',
  HEAVY_EQUIPMENT_WORKS = 'HEAVY_EQUIPMENT_WORKS',
  ELECTRICAL_MATERIALS_WORKS = 'ELECTRICAL_MATERIALS_WORKS',
  PLUMBING_MATERIALS = 'PLUMBING_MATERIALS',
  CONSTRUCTION_MATERIALS = 'CONSTRUCTION_MATERIALS',
  CLEANING_SUPPLIES = 'CLEANING_SUPPLIES',
  PACKAGING_CONTAINERS = 'PACKAGING_CONTAINERS',
  OFFICE_SUPPLIES_PRINTING = 'OFFICE_SUPPLIES_PRINTING',
  LAB_ANALYSIS_FEES = 'LAB_ANALYSIS_FEES',
  GOVERNMENT_TAXES_FEES = 'GOVERNMENT_TAXES_FEES',
  COURIER_POST_SHIPPING = 'COURIER_POST_SHIPPING',
  TOOLS_HARDWARE_SERVICES = 'TOOLS_HARDWARE_SERVICES',
  SAFETY_INSURANCE = 'SAFETY_INSURANCE',
  MEALS_CATERING = 'MEALS_CATERING',
  MACHINE_MAINTENANCE_REPAIR = 'MACHINE_MAINTENANCE_REPAIR',
  AGRICULTURE_SUPPLIES = 'AGRICULTURE_SUPPLIES',
  TRANSPORT_LOGISTICS = 'TRANSPORT_LOGISTICS',
  DONATIONS_SOCIAL = 'DONATIONS_SOCIAL',
  UTILITIES_WATER = 'UTILITIES_WATER',
  FACTORY_CONSUMABLES = 'FACTORY_CONSUMABLES',
  TOLLS_AND_ROAD_FEES = 'TOLLS_AND_ROAD_FEES',
  NON_OPERATING_PERSONAL = 'NON_OPERATING_PERSONAL',
  OTHER = 'OTHER'
}
export const EXPENSE_CATEGORY_OPTIONS: {
  label: string;
  value: ExpenseCategory;
  labelTranslatePath: string;
}[] = [
  { label: 'Fuel', value: ExpenseCategory.FUEL, labelTranslatePath: 'EXPENSE.CATEGORY.FUEL' },
  { label: 'Lubricants', value: ExpenseCategory.LUBRICANTS, labelTranslatePath: 'EXPENSE.CATEGORY.LUBRICANTS' },
  {
    label: 'Vehicle parts & service',
    value: ExpenseCategory.VEHICLE_PARTS_SERVICE,
    labelTranslatePath: 'EXPENSE.CATEGORY.VEHICLE_PARTS_SERVICE'
  },
  {
    label: 'Heavy equipment works',
    value: ExpenseCategory.HEAVY_EQUIPMENT_WORKS,
    labelTranslatePath: 'EXPENSE.CATEGORY.HEAVY_EQUIPMENT_WORKS'
  },
  {
    label: 'Electrical (materials & works)',
    value: ExpenseCategory.ELECTRICAL_MATERIALS_WORKS,
    labelTranslatePath: 'EXPENSE.CATEGORY.ELECTRICAL_MATERIALS_WORKS'
  },
  { label: 'Plumbing materials', value: ExpenseCategory.PLUMBING_MATERIALS, labelTranslatePath: 'EXPENSE.CATEGORY.PLUMBING_MATERIALS' },
  {
    label: 'Construction materials',
    value: ExpenseCategory.CONSTRUCTION_MATERIALS,
    labelTranslatePath: 'EXPENSE.CATEGORY.CONSTRUCTION_MATERIALS'
  },
  { label: 'Cleaning supplies', value: ExpenseCategory.CLEANING_SUPPLIES, labelTranslatePath: 'EXPENSE.CATEGORY.CLEANING_SUPPLIES' },
  {
    label: 'Packaging & containers',
    value: ExpenseCategory.PACKAGING_CONTAINERS,
    labelTranslatePath: 'EXPENSE.CATEGORY.PACKAGING_CONTAINERS'
  },
  {
    label: 'Office supplies & printing',
    value: ExpenseCategory.OFFICE_SUPPLIES_PRINTING,
    labelTranslatePath: 'EXPENSE.CATEGORY.OFFICE_SUPPLIES_PRINTING'
  },
  { label: 'Lab & analysis fees', value: ExpenseCategory.LAB_ANALYSIS_FEES, labelTranslatePath: 'EXPENSE.CATEGORY.LAB_ANALYSIS_FEES' },
  {
    label: 'Government taxes & fees',
    value: ExpenseCategory.GOVERNMENT_TAXES_FEES,
    labelTranslatePath: 'EXPENSE.CATEGORY.GOVERNMENT_TAXES_FEES'
  },
  {
    label: 'Courier & shipping',
    value: ExpenseCategory.COURIER_POST_SHIPPING,
    labelTranslatePath: 'EXPENSE.CATEGORY.COURIER_POST_SHIPPING'
  },
  {
    label: 'Tools & hardware services',
    value: ExpenseCategory.TOOLS_HARDWARE_SERVICES,
    labelTranslatePath: 'EXPENSE.CATEGORY.TOOLS_HARDWARE_SERVICES'
  },
  { label: 'Safety & insurance', value: ExpenseCategory.SAFETY_INSURANCE, labelTranslatePath: 'EXPENSE.CATEGORY.SAFETY_INSURANCE' },
  { label: 'Meals & catering', value: ExpenseCategory.MEALS_CATERING, labelTranslatePath: 'EXPENSE.CATEGORY.MEALS_CATERING' },
  {
    label: 'Machine maintenance & repair',
    value: ExpenseCategory.MACHINE_MAINTENANCE_REPAIR,
    labelTranslatePath: 'EXPENSE.CATEGORY.MACHINE_MAINTENANCE_REPAIR'
  },
  {
    label: 'Agriculture supplies',
    value: ExpenseCategory.AGRICULTURE_SUPPLIES,
    labelTranslatePath: 'EXPENSE.CATEGORY.AGRICULTURE_SUPPLIES'
  },
  {
    label: 'Transport & logistics',
    value: ExpenseCategory.TRANSPORT_LOGISTICS,
    labelTranslatePath: 'EXPENSE.CATEGORY.TRANSPORT_LOGISTICS'
  },
  { label: 'Donations & social', value: ExpenseCategory.DONATIONS_SOCIAL, labelTranslatePath: 'EXPENSE.CATEGORY.DONATIONS_SOCIAL' },
  { label: 'Utilities – water', value: ExpenseCategory.UTILITIES_WATER, labelTranslatePath: 'EXPENSE.CATEGORY.UTILITIES_WATER' },
  { label: 'Factory consumables', value: ExpenseCategory.FACTORY_CONSUMABLES, labelTranslatePath: 'EXPENSE.CATEGORY.FACTORY_CONSUMABLES' },
  { label: 'Tolls & road fees', value: ExpenseCategory.TOLLS_AND_ROAD_FEES, labelTranslatePath: 'EXPENSE.CATEGORY.TOLLS_AND_ROAD_FEES' },
  {
    label: 'Non-operating / personal',
    value: ExpenseCategory.NON_OPERATING_PERSONAL,
    labelTranslatePath: 'EXPENSE.CATEGORY.NON_OPERATING_PERSONAL'
  },
  { label: 'Other', value: ExpenseCategory.OTHER, labelTranslatePath: 'EXPENSE.CATEGORY.OTHER' }
];

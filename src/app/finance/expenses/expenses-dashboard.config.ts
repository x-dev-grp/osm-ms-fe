import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import {
  AttributeType,
  DashboardConfig,
  FieldType,
} from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { UnitType } from '../models/OilCredit';
import { ExpenseCategory } from '../models/expense.model';

export const EXPENSES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'payments',
  /* ───────────────────────────── méta ───────────────────────────── */
  title: 'Dépenses',
  titleTranslatePath: 'EXPENSES.TITLE',
  baseURL: 'finance/expense',
  searchEndpoint: 'finance/expense',


  /* ─────────────────── bouton "ajouter une dépense" ─────────────── */
  addNewItem: true,
  addNewItemUrl: '/finance/expenses/new',

  /* ─────────────────────────── colonnes du tableau ──────────────── */
  fields: [
    {
      name: 'invoiceRef',
      label: 'Référence facture',
      labelTranslatePath: 'EXPENSES.FIELDS.INVOICE_REF',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'purchaseNature',
      label: 'Nature de l\'achat',
      labelTranslatePath: 'EXPENSES.FIELDS.PURCHASE_NATURE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'object',
      label: 'Objet',
      labelTranslatePath: 'EXPENSES.FIELDS.OBJECT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'amount',
      label: 'Montant',
      labelTranslatePath: 'EXPENSES.FIELDS.AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'vendor',
      label: 'Fournisseur',
      labelTranslatePath: 'EXPENSES.FIELDS.VENDOR',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'category',
      label: 'Catégorie',
      labelTranslatePath: 'EXPENSES.FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Fuel', value: ExpenseCategory.FUEL, labelTranslatePath: 'EXPENSE.CATEGORY.FUEL' },
        { label: 'Lubricants', value: ExpenseCategory.LUBRICANTS, labelTranslatePath: 'EXPENSE.CATEGORY.LUBRICANTS' },
        { label: 'Vehicle parts & service', value: ExpenseCategory.VEHICLE_PARTS_SERVICE, labelTranslatePath: 'EXPENSE.CATEGORY.VEHICLE_PARTS_SERVICE' },
        { label: 'Heavy equipment works', value: ExpenseCategory.HEAVY_EQUIPMENT_WORKS, labelTranslatePath: 'EXPENSE.CATEGORY.HEAVY_EQUIPMENT_WORKS' },
        { label: 'Electrical (materials & works)', value: ExpenseCategory.ELECTRICAL_MATERIALS_WORKS, labelTranslatePath: 'EXPENSE.CATEGORY.ELECTRICAL_MATERIALS_WORKS' },
        { label: 'Plumbing materials', value: ExpenseCategory.PLUMBING_MATERIALS, labelTranslatePath: 'EXPENSE.CATEGORY.PLUMBING_MATERIALS' },
        { label: 'Construction materials', value: ExpenseCategory.CONSTRUCTION_MATERIALS, labelTranslatePath: 'EXPENSE.CATEGORY.CONSTRUCTION_MATERIALS' },
        { label: 'Cleaning supplies', value: ExpenseCategory.CLEANING_SUPPLIES, labelTranslatePath: 'EXPENSE.CATEGORY.CLEANING_SUPPLIES' },
        { label: 'Packaging & containers', value: ExpenseCategory.PACKAGING_CONTAINERS, labelTranslatePath: 'EXPENSE.CATEGORY.PACKAGING_CONTAINERS' },
        { label: 'Office supplies & printing', value: ExpenseCategory.OFFICE_SUPPLIES_PRINTING, labelTranslatePath: 'EXPENSE.CATEGORY.OFFICE_SUPPLIES_PRINTING' },
        { label: 'Lab & analysis fees', value: ExpenseCategory.LAB_ANALYSIS_FEES, labelTranslatePath: 'EXPENSE.CATEGORY.LAB_ANALYSIS_FEES' },
        { label: 'Government taxes & fees', value: ExpenseCategory.GOVERNMENT_TAXES_FEES, labelTranslatePath: 'EXPENSE.CATEGORY.GOVERNMENT_TAXES_FEES' },
        { label: 'Courier & shipping', value: ExpenseCategory.COURIER_POST_SHIPPING, labelTranslatePath: 'EXPENSE.CATEGORY.COURIER_POST_SHIPPING' },
        { label: 'Tools & hardware services', value: ExpenseCategory.TOOLS_HARDWARE_SERVICES, labelTranslatePath: 'EXPENSE.CATEGORY.TOOLS_HARDWARE_SERVICES' },
        { label: 'Safety & insurance', value: ExpenseCategory.SAFETY_INSURANCE, labelTranslatePath: 'EXPENSE.CATEGORY.SAFETY_INSURANCE' },
        { label: 'Meals & catering', value: ExpenseCategory.MEALS_CATERING, labelTranslatePath: 'EXPENSE.CATEGORY.MEALS_CATERING' },
        { label: 'Machine maintenance & repair', value: ExpenseCategory.MACHINE_MAINTENANCE_REPAIR, labelTranslatePath: 'EXPENSE.CATEGORY.MACHINE_MAINTENANCE_REPAIR' },
        { label: 'Agriculture supplies', value: ExpenseCategory.AGRICULTURE_SUPPLIES, labelTranslatePath: 'EXPENSE.CATEGORY.AGRICULTURE_SUPPLIES' },
        { label: 'Transport & logistics', value: ExpenseCategory.TRANSPORT_LOGISTICS, labelTranslatePath: 'EXPENSE.CATEGORY.TRANSPORT_LOGISTICS' },
        { label: 'Donations & social', value: ExpenseCategory.DONATIONS_SOCIAL, labelTranslatePath: 'EXPENSE.CATEGORY.DONATIONS_SOCIAL' },
        { label: 'Utilities – water', value: ExpenseCategory.UTILITIES_WATER, labelTranslatePath: 'EXPENSE.CATEGORY.UTILITIES_WATER' },
        { label: 'Factory consumables', value: ExpenseCategory.FACTORY_CONSUMABLES, labelTranslatePath: 'EXPENSE.CATEGORY.FACTORY_CONSUMABLES' },
        { label: 'Tolls & road fees', value: ExpenseCategory.TOLLS_AND_ROAD_FEES, labelTranslatePath: 'EXPENSE.CATEGORY.TOLLS_AND_ROAD_FEES' },
        { label: 'Non-operating / personal', value: ExpenseCategory.NON_OPERATING_PERSONAL, labelTranslatePath: 'EXPENSE.CATEGORY.NON_OPERATING_PERSONAL' },
        { label: 'Other', value: ExpenseCategory.OTHER, labelTranslatePath: 'EXPENSE.CATEGORY.OTHER' }

      ],           // <-- standardized options

    },
    {
      name: 'paymentMethod',
      label: 'Méthode de paiement',
      labelTranslatePath: 'EXPENSES.FIELDS.PAYMENT_METHOD',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'EXPENSES.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'notes',
      label: 'Notes',
      labelTranslatePath: 'EXPENSES.FIELDS.NOTES',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'receiptNumber',
      label: 'Numéro de reçu',
      labelTranslatePath: 'EXPENSES.FIELDS.RECEIPT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdBy',
      label: 'Créé par',
      labelTranslatePath: 'EXPENSES.FIELDS.CREATED_BY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approved',
      label: 'Approuvé',
      labelTranslatePath: 'EXPENSES.FIELDS.APPROVED',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'approvalDate',
      label: "Date d'approbation",
      labelTranslatePath: 'EXPENSES.FIELDS.APPROVAL_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  /* ───────────────────────────── actions ─────────────────────────── */


  /* ──────────────── nom du fichier exporté (optionnel) ───────────── */
  fileName: 'expenses',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  }
};

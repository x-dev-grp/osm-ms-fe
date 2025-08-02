import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const CUSTOMERS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'people',
  title: 'Clients',
  titleTranslatePath: 'CUSTOMERS.TITLE',
  baseURL: 'finance/customers',
  searchEndpoint: 'finance/customers',
  addNewItem: true,
  addNewItemUrl: 'finance/customers/new',
  /* ── Data-table columns & filter metadata ───────────────────── */
  fields: [
    // ==================== CORE CUSTOMER FIELDS ====================
    {
      name: 'matriculeFiscal',
      label: 'Matricule Fiscal',
      labelTranslatePath: 'CUSTOMERS.FIELDS.MATRICULE_FISCAL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'numCIN',
      label: 'Numéro CIN',
      labelTranslatePath: 'CUSTOMERS.FIELDS.NUM_CIN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'customerName',
      label: 'Nom',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CUSTOMER_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'customerLastName',
      label: 'Prénom',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CUSTOMER_LAST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    // ==================== CONTACT INFORMATION ====================
    {
      name: 'contactPerson',
      label: 'Personne de contact',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CONTACT_PERSON',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'CUSTOMERS.FIELDS.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'phone',
      label: 'Téléphone',
      labelTranslatePath: 'CUSTOMERS.FIELDS.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'mobile',
      label: 'Mobile',
      labelTranslatePath: 'CUSTOMERS.FIELDS.MOBILE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'fax',
      label: 'Fax',
      labelTranslatePath: 'CUSTOMERS.FIELDS.FAX',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== ADDRESS INFORMATION ====================
    {
      name: 'address',
      label: 'Adresse',
      labelTranslatePath: 'CUSTOMERS.FIELDS.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'postalCode',
      label: 'Code Postal',
      labelTranslatePath: 'CUSTOMERS.FIELDS.POSTAL_CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'country',
      label: 'Pays',
      labelTranslatePath: 'CUSTOMERS.FIELDS.COUNTRY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },

    // ==================== BUSINESS INFORMATION ====================
    {
      name: 'category',
      label: 'Catégorie',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.autocomplete,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'INDIVIDUAL', label: 'Individuel', labelTranslatePath: 'CUSTOMERS.CATEGORIES.INDIVIDUAL' },
        { value: 'BUSINESS', label: 'Entreprise', labelTranslatePath: 'CUSTOMERS.CATEGORIES.BUSINESS' }
      ]
    },

    // ==================== METADATA FIELDS ====================
    {
      name: 'notes',
      label: 'Notes',
      labelTranslatePath: 'CUSTOMERS.FIELDS.NOTES',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false, // Notes are not sortable
      dataTable: false, // Hide from main table, available in details
      filterable: false // Notes are not filterable
    },

    // ==================== RELATIONSHIP FIELDS ====================
    {
      name: 'transactions',
      label: 'Transactions',
      labelTranslatePath: 'CUSTOMERS.FIELDS.TRANSACTIONS',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: false // Relationship fields are not filterable
    },
    {
      name: 'bankAccounts',
      label: 'Comptes Bancaires',
      labelTranslatePath: 'CUSTOMERS.FIELDS.BANK_ACCOUNTS',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: false // Relationship fields are not filterable
    },

    // ==================== SYSTEM FIELDS ====================
    {
      name: 'createdDate',
      label: 'Date de création',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lastModifiedDate',
      label: 'Dernière modification',
      labelTranslatePath: 'CUSTOMERS.FIELDS.LAST_MODIFIED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    }
  ],

  /* ── Menu actions (no status mapping) ───────────────────────── */
  fileName: 'clients'
};

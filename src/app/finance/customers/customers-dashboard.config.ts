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
      dataTable: true,
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
      name: 'address',
      label: 'Adresse',
      labelTranslatePath: 'CUSTOMERS.FIELDS.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
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
      dataTable: true,
      filterable: true
    },
    {
      name: 'category',
      label: 'Catégorie',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CATEGORY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  /* ── Menu actions (no status mapping) ───────────────────────── */
  fileName: 'clients'
}; 
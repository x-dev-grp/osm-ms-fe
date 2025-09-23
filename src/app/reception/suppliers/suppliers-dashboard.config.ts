import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const SUPPLIERS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'people',
  /* ─────────── basic info ─────────── */
  title: 'Fournisseurs',
  titleTranslatePath: 'MENU.RECEPTION.AGRICULTURE',
  baseURL: 'production/suppliers_type',
  searchEndpoint: 'production/suppliers_type',

  /* ───────── add-new button ───────── */
  addNewItem: true,
  addNewItemUrl: 'reception/fournisseur/new',

  /* ─────────── table & filters ────── */
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  },
  fields: [
    {
      name: 'name',
      label: 'Prénom',
      labelTranslatePath: 'SUPPLIERS.FIRST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lastname',
      label: 'Nom',
      labelTranslatePath: 'SUPPLIERS.LAST_NAME',
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
      labelTranslatePath: 'SUPPLIERS.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'SUPPLIERS.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'address',
      label: 'Adresse',
      labelTranslatePath: 'SUPPLIERS.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
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
      name: 'category',
      label: 'Catégorie',
      labelTranslatePath: 'CUSTOMERS.FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'INDIVIDUAL', label: 'Individuel', labelTranslatePath: 'CUSTOMERS.CATEGORIES.INDIVIDUAL' },
        { value: 'BUSINESS', label: 'Entreprise', labelTranslatePath: 'CUSTOMERS.CATEGORIES.BUSINESS' }
      ]
    },
    {
      name: 'genericSupplierType',
      label: 'Type de fournisseur',
      labelTranslatePath: 'SUPPLIERS.TYPE',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'region',
      label: 'Région',
      labelTranslatePath: 'SUPPLIERS.REGION',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'region.name'
    }
  ],

  /* ─────────── action menu ────────── */
  fileName: 'suppliers'
};

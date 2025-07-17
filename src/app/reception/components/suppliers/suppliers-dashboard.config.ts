import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const SUPPLIERS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'people',
  /* ─────────── basic info ─────────── */
  title: 'Fournisseurs',
  titleTranslatePath: 'SUPPLIERS.TITLE',
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
      search: {}
    }
  },
  fields: [
    {
      name: 'supplierInfo.name',
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
      name: 'supplierInfo.lastname',
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
      name: 'supplierInfo.phone',
      label: 'Téléphone',
      labelTranslatePath: 'SUPPLIERS.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.email',
      label: 'Email',
      labelTranslatePath: 'SUPPLIERS.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.address',
      label: 'Adresse',
      labelTranslatePath: 'SUPPLIERS.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'genericSupplierType',
      label: 'Type de fournisseur',
      labelTranslatePath: 'SUPPLIERS.TYPE',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'supplierInfo.region',
      label: 'Région',
      labelTranslatePath: 'SUPPLIERS.REGION',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    }
  ],

  /* ─────────── action menu ────────── */
  fileName: 'suppliers'
};

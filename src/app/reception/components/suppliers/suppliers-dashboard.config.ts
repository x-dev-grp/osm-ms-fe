import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const SUPPLIERS_DASHBOARD_CONFIG: DashboardConfig = {
  /* ─────────── basic info ─────────── */
  title: 'Fournisseurs',
  titleTranslatePath: 'SUPPLIERS.TITLE',
  baseURL: 'suppliers',
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
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.email',
      label: 'Email',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.address',
      label: 'Adresse',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'genericSupplierType',
      label: 'Type de fournisseur',
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
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'READ' },
      { label: 'Modifier', icon: 'edit', value: 'EDIT' },
      { label: 'Supprimer', icon: 'delete', value: 'DELETE' }
    ]
  },

  fileName: 'suppliers'
};

import { Action, AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';

export const SUPPLIERS_DASHBOARD_CONFIG: DashboardConfig = {
  /* ─────────── basic info ─────────── */
  title: 'Suppliers',
  baseURL: 'production/suppliers_type',
  searchEndpoint: 'production/suppliers_type',

  /* ───────── add-new button ───────── */
  addNewItem: true,
  addNewItemUrl: 'production/suppliers_type/new',

  /* ─────────── table & filters ────── */
  fields: [
    {
      name: 'supplierInfo.name',
      label: 'First Name',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      exportable: true,
      dataTable: true,
      filterable: true,
      defaultFilter: true
    },
    {
      name: 'supplierInfo.lastname',
      label: 'Last Name',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      exportable: true,

      filterable: true
    },
    {
      name: 'supplierInfo.phone',
      label: 'Phone',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      exportable: true,

      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.email',
      label: 'Email',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      exportable: true,

      filterable: true
    },
    {
      name: 'supplierInfo.address',
      label: 'Address',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,

      dataTable: true
    },
    {
      name: 'genericSupplierType.name',
      label: 'Supplier Type',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,

      dataTable: true,
      filterable: true
    },
    {
      name: 'supplierInfo.region.name',
      label: 'Region',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,

      dataTable: true,
      filterable: true
    }
  ],

  /* ─────────── action menu ────────── */
  actions: {
    statusMapping: false,
    actionsList: <Action[]>[
      { label: 'Consulter', icon: 'visibility', value: 'VIEW' },
      { label: 'Modifier', icon: 'edit', value: 'EDIT' },
      { label: 'Supprimer', icon: 'delete', value: 'DELETE' }
    ]
  },

  fileName: 'suppliers'
};

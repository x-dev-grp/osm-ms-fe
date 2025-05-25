import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const SUPPLIER_DASHBOARD: DashboardConfig = {
  title: 'Fournisseurs',
  titleTranslatePath: 'SUPPLIERS.TITLE',
  baseURL: 'suppliers',
  searchEndpoint: 'suppliers',
  addNewItem: true,
  addNewItemUrl: 'supplier/new',
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
      name: 'supplierNumber',
      label: 'N° Fournisseur',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'name',
      label: 'Nom',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'type',
      label: 'Type',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Olive', value: 'OLIVE' },
        { label: 'Huile', value: 'OIL' }
      ]
    },
    {
      name: 'phone',
      label: 'Téléphone',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'address',
      label: 'Adresse',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Actif', value: 'ACTIVE' },
        { label: 'Inactif', value: 'INACTIVE' }
      ]
    }
  ],
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'CONSULTER' },
      { label: 'Modifier', icon: 'edit', value: 'MODIFIER' },
      { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' }
    ]
  },
  fileName: 'suppliers'
}; 
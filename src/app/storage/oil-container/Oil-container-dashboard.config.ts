import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const dashboardConfig: DashboardConfig = {
  icon: 'inventory_2',
  title: "Gestion des contenants d'huile",
  titleTranslatePath: 'AUTO.GESTION_DES_CONTENANTS_D_HUILE',
  baseURL: 'production/oil_container',
  searchEndpoint: 'production/oil_container',
  addNewItem: true,
  addNewItemUrl: 'storage/oil-container/new',
  fileName: 'OIL_CONTAINER_LIST',

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
      label: 'Contenant',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'name',
      exportLabel: 'Contenant'
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'capacityInLiters',
      label: 'Capacité (L)',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.CAPACITY_IN_LITERS',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'capacityInLiters',
      exportLabel: 'Capacité (L)'
    },
    {
      name: 'stockQuantity',
      label: 'Quantité en stock',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.STOCK_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'stockQuantity',
      exportLabel: 'Qté en stock'
    },
    {
      name: 'buyPrice',
      label: "Prix d'achat",
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.BUY_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'buyPrice',
      exportLabel: 'Prix achat'
    },
    {
      name: 'sellingPrice',
      label: 'Prix de vente',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.SELLING_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'sellingPrice',
      exportLabel: 'Prix vente'
    },
    {
      name: 'active',
      label: 'Actif',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      filterAttribute: 'active',
      exportLabel: 'Actif'
    }
  ]
};

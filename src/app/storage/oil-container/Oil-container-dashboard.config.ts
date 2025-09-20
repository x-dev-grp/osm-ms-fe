import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const dashboardConfig: DashboardConfig = {
  icon: 'inventory_2',
  title: 'Gestion des contenants d\'huile',
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
      name: 'lotNumber',
      label: 'lotNumber',
      labelTranslatePath: 'DELIVERIES.FIELDS.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      exportLabel: 'lotNumber',
      filterAttribute: 'lotNumber'
    },
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
      exportLabel: 'Contenant',
      filterAttribute: 'name'
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
      exportable: true
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
      exportable: true
    },
    {
      name: 'material',
      label: 'Matériau',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.MATERIAL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'buyPrice',
      label: 'Prix d\'achat',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.BUY_PRICE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'sellingPrice',
      label: 'Prix de vente',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.SELLING_PRICE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'reorderThreshold',
      label: 'Seuil de réapprovisionnement',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.REORDER_THRESHOLD',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'reorderQuantity',
      label: 'Quantité de réappro.',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.REORDER_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'sku',
      label: 'SKU',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.SKU',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'barcode',
      label: 'Code-barres',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.BARCODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'storageLocationCode',
      label: 'Emplacement',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.STORAGE_LOCATION_CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'imageUrl',
      label: 'Image',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.IMAGE_URL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: false,
      defaultFilter: false,
      dataTable: false,
      exportable: true
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
      exportable: true
    },
    {
      name: 'certification',
      label: 'Certification',
      labelTranslatePath: 'OIL_CONTAINER.DASHBOARD.FIELDS.CERTIFICATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    }
  ],

};

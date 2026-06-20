import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const BOM_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'schema',
  title: 'Gestion des Nomenclatures',
  titleTranslatePath: 'DASHBOARD_TITLES.BOMS',
  baseURL: 'inventaire/boms',
  searchEndpoint: 'inventaire/boms',
  addNewItem: true,
  addNewItemUrl: '/stock/boms/nouveau',
  fileName: 'boms',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'ACTIVATE', color: 'primary', icon: 'check_circle' },
    { action: 'REMOVE', color: 'warn', icon: 'delete' }
  ],
  fields: [
    {
      name: 'finalProductName',
      label: 'Produit fini',
      labelTranslatePath: 'DASHBOARD_FIELDS.FINAL_PRODUCT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'version',
      label: 'Version',
      labelTranslatePath: 'DASHBOARD_FIELDS.VERSION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'active',
      label: 'Actif',
      labelTranslatePath: 'ADMIN_DASHBOARD.HERO.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdDate',
      label: 'Date de creation',
      labelTranslatePath: 'DASHBOARD_FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: { isDeleted: { equalValue: false } },
      searchs: []
    }
  }
};

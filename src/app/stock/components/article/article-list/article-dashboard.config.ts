import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const ARTICLE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'inventory_2',
  title: 'Gestion des Articles',
  titleTranslatePath: 'DASHBOARD_TITLES.ARTICLES',
  baseURL: 'inventaire/articles',
  searchEndpoint: 'inventaire/articles',
  addNewItem: true,
  addNewItemUrl: '/stock/articles/nouveau',
  fileName: 'articles',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'TOGGLE_ACTIVE', color: 'primary', icon: 'power_settings_new' }
  ],
  fields: [
    {
      name: 'code',
      label: 'Code',
      labelTranslatePath: 'DASHBOARD_FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'nom',
      label: 'Nom',
      labelTranslatePath: 'DASHBOARD_FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'categorie',
      label: 'Categorie',
      labelTranslatePath: 'DASHBOARD_FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'UNITE', label: 'Unite' },
        { value: 'COLIS', label: 'Colis' },
        { value: 'PALETTE', label: 'Palette' },
        { value: 'EMBALLAGE', label: 'Emballage' },
        { value: 'CONSOMMABLE', label: 'Consommable' }
      ]
    },
    {
      name: 'stockMinimum',
      label: 'Stock minimum',
      labelTranslatePath: 'DASHBOARD_FIELDS.STOCK_MINIMUM',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteDisponible',
      label: 'Disponible',
      labelTranslatePath: 'DASHBOARD_FIELDS.AVAILABLE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'actif',
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
      search: {
        isDeleted: {
          equalValue: false
        }
      },
      searchs: []
    }
  }
};

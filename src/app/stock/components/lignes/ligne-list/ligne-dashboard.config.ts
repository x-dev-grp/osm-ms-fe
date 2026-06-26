import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const LIGNE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'precision_manufacturing',
  title: 'Gestion des Lignes',
  titleTranslatePath: 'DASHBOARD_TITLES.LINES',
  baseURL: 'inventaire/lignes',
  searchEndpoint: 'inventaire/lignes',
  addNewItem: true,
  addNewItemUrl: '/stock/lignes/nouveau',
  fileName: 'lignes',
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
      name: 'responsable',
      label: 'Responsable',
      labelTranslatePath: 'DASHBOARD_FIELDS.RESPONSIBLE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'vitesseNominale',
      label: 'Vitesse',
      labelTranslatePath: 'DASHBOARD_FIELDS.SPEED',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'etat',
      label: 'Etat',
      labelTranslatePath: 'DASHBOARD_FIELDS.STATE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
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
      search: { isDeleted: { equalValue: false } },
      searchs: []
    }
  }
};

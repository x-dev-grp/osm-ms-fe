import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const EMPLACEMENT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'place',
  title: 'Gestion des Emplacements',
  titleTranslatePath: 'DASHBOARD_TITLES.LOCATIONS',
  baseURL: 'inventaire/emplacements',
  searchEndpoint: 'inventaire/emplacements',
  addNewItem: true,
  addNewItemUrl: '/stock/emplacements/nouveau',
  fileName: 'emplacements',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'TOGGLE_ACTIVE', color: 'primary', icon: 'power_settings_new' },
    { action: 'REMOVE', color: 'warn', icon: 'delete' }
  ],
  fields: [
    { name: 'code', label: 'Code', labelTranslatePath: 'DASHBOARD_FIELDS.CODE', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'nom', label: 'Nom', labelTranslatePath: 'DASHBOARD_FIELDS.NAME', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'typeEmplacement', label: 'Type', labelTranslatePath: 'DASHBOARD_FIELDS.TYPE', attributeType: AttributeType.enum, fieldType: FieldType.select, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'zone', label: 'Zone', labelTranslatePath: 'DASHBOARD_FIELDS.ZONE', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'capaciteMaximale', label: 'Capacite maximale', labelTranslatePath: 'DASHBOARD_FIELDS.MAX_CAPACITY', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'capaciteActuelle', label: 'Capacite actuelle', labelTranslatePath: 'DASHBOARD_FIELDS.CURRENT_CAPACITY', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'disponible', label: 'Disponible', labelTranslatePath: 'DASHBOARD_FIELDS.AVAILABLE', attributeType: AttributeType.boolean, fieldType: FieldType.checkbox, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'actif', label: 'Actif', labelTranslatePath: 'ADMIN_DASHBOARD.HERO.ACTIVE', attributeType: AttributeType.boolean, fieldType: FieldType.checkbox, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'createdDate', label: 'Date de creation', labelTranslatePath: 'DASHBOARD_FIELDS.CREATED_DATE', attributeType: AttributeType.date, fieldType: FieldType.date, exportable: true, sortable: true, dataTable: true, filterable: true }
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

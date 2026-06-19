import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const FILTRATION_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'oil_barrel',
  title: 'Filtration',
  titleTranslatePath: 'DASHBOARD_TITLES.FILTRATION',
  baseURL: 'production/filtration-operations',
  searchEndpoint: 'production/filtration-operations',
  addNewItem: true,
  addNewItemUrl: '/storage/oil-filtering/new',
  fileName: 'filtration-operations',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'START', color: 'primary', icon: 'play_arrow' },
    { action: 'STATUS', color: 'primary', icon: 'swap_horiz' },
    { action: 'TRACEABILITY', color: 'primary', icon: 'account_tree' },
    { action: 'OIL_QUALITY', color: 'primary', icon: 'science' },
    { action: 'PREPARE_LABEL', color: 'primary', icon: 'sell' },
    { action: 'REMOVE', color: 'warn', icon: 'delete' }
  ],
  fields: [
    {
      name: 'operationDate',
      label: 'Date',
      labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'sourceStorageUnit.name',
      label: 'Source',
      labelTranslatePath: 'DASHBOARD_FIELDS.SOURCE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'targetStorageUnit.name',
      label: 'Cible',
      labelTranslatePath: 'DASHBOARD_FIELDS.TARGET',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'volumeToFilter',
      label: 'Volume filtre',
      labelTranslatePath: 'DASHBOARD_FIELDS.FILTERED_VOLUME',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'volumeAfter',
      label: 'Volume apres',
      labelTranslatePath: 'DASHBOARD_FIELDS.VOLUME_AFTER',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lossPercent',
      label: 'Perte (%)',
      labelTranslatePath: 'DASHBOARD_FIELDS.LOSS_PERCENT',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'DASHBOARD_FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'CREATED', label: 'Creee', labelTranslatePath: 'DASHBOARD_FIELDS.FILTRATION_CREATED' },
        { value: 'IN_PROGRESS', label: 'En cours', labelTranslatePath: 'DASHBOARD_FIELDS.FILTRATION_IN_PROGRESS' },
        { value: 'COMPLETED', label: 'Terminee', labelTranslatePath: 'DASHBOARD_FIELDS.FILTRATION_COMPLETED' },
        { value: 'CANCELLED', label: 'Annulee', labelTranslatePath: 'DASHBOARD_FIELDS.FILTRATION_CANCELLED' }
      ]
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'operationDate',
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

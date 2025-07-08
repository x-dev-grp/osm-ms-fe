import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const MILL_MACHINE_DASHBOARD: DashboardConfig = {
  title: 'Machines de Moulin',
  titleTranslatePath: 'MILL.MACHINE_TITLE',
  baseURL: 'production/millers',
  searchEndpoint: 'production/millers',
  addNewItem: true,
  addNewItemUrl: 'reception/mill-machines/new',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'name',
    order: 'ASC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {}
    }
  },
  fields: [
    {
      name: 'name',
      label: 'Nom',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'machineType',
      label: 'Type de Machine',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.MACHINE_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'manufacturer',
      label: 'Fabricant',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.MANUFACTURER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'model',
      label: 'Modèle',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.MODEL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'capacity',
      label: 'Capacité',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.CAPACITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    {
      name: 'hoursOperated',
      label: "Heures d'opération",
      labelTranslatePath: 'MILL_MACHINE.FIELDS.HOURS_OPERATED',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lastMaintenanceDate',
      label: 'Dernière Maintenance',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.LAST_MAINTENANCE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'nextMaintenanceDate',
      label: 'Prochaine Maintenance',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.NEXT_MAINTENANCE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  fileName: 'mill_machines'
};

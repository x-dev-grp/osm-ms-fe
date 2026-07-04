import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'TRACTOR', label: 'Tractor', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.TYPE.TRACTOR' },
  { value: 'TRAILER', label: 'Trailer', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.TYPE.TRAILER' },
  { value: 'PUMP', label: 'Pump', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.TYPE.PUMP' },
  { value: 'HARVESTER', label: 'Harvester', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.TYPE.HARVESTER' },
  { value: 'OTHER', label: 'Other', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.TYPE.OTHER' }
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.STATUS.AVAILABLE' },
  { value: 'IN_USE', label: 'In use', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.STATUS.IN_USE' },
  { value: 'MAINTENANCE', label: 'Maintenance', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.STATUS.MAINTENANCE' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service', labelTranslatePath: 'MAINTENANCE.EQUIPMENT.STATUS.OUT_OF_SERVICE' }
];

export const EQUIPMENT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'agriculture',
  title: '',
  titleTranslatePath: 'MENU.EQUIPMENT.REGISTRY',
  baseURL: 'production/mill-equipment',
  searchEndpoint: 'production/mill-equipment',
  addNewItem: true,
  addNewItemUrl: '/mill-equipment/new',
  fileName: 'mill_equipment',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'name',
    order: 'ASC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: { equalValue: false }
      }
    }
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      labelTranslatePath: 'MAINTENANCE.EQUIPMENT.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'equipmentType',
      label: 'Type',
      labelTranslatePath: 'MAINTENANCE.EQUIPMENT.FIELDS.TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: EQUIPMENT_TYPE_OPTIONS
    },
    {
      name: 'registrationNumber',
      label: 'Registration',
      labelTranslatePath: 'MAINTENANCE.EQUIPMENT.FIELDS.REGISTRATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'defaultHourlyRate',
      label: 'Hourly rate',
      labelTranslatePath: 'MAINTENANCE.EQUIPMENT.FIELDS.HOURLY_RATE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Status',
      labelTranslatePath: 'ADMIN_DASHBOARD.TABLE.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: STATUS_OPTIONS
    },
    {
      name: 'hoursOperated',
      label: 'Hours',
      labelTranslatePath: 'MAINTENANCE.EQUIPMENT.FIELDS.HOURS',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    }
  ]
};

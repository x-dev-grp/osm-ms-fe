import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned', labelTranslatePath: 'MAINTENANCE.STATUS.PLANNED' },
  { value: 'IN_PROGRESS', label: 'In progress', labelTranslatePath: 'MAINTENANCE.STATUS.IN_PROGRESS' },
  { value: 'COMPLETED', label: 'Completed', labelTranslatePath: 'MAINTENANCE.STATUS.COMPLETED' },
  { value: 'CANCELLED', label: 'Cancelled', labelTranslatePath: 'MAINTENANCE.STATUS.CANCELLED' }
];

export const MISSION_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'local_shipping',
  title: '',
  titleTranslatePath: 'MENU.EQUIPMENT.MISSIONS',
  baseURL: 'production/equipment-service-missions',
  searchEndpoint: 'production/equipment-service-missions',
  addNewItem: true,
  addNewItemUrl: '/equipment-missions/new',
  fileName: 'equipment_service_missions',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
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
      name: 'clientName',
      label: 'Client',
      labelTranslatePath: 'MAINTENANCE.MISSIONS.FIELDS.CLIENT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'equipment',
      valuePath: 'name',
      label: 'Equipment',
      labelTranslatePath: 'MAINTENANCE.FIELDS.ASSET',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
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
      name: 'billableHours',
      label: 'Hours',
      labelTranslatePath: 'MAINTENANCE.MISSIONS.FIELDS.HOURS',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'hourlyRate',
      label: 'Rate',
      labelTranslatePath: 'MAINTENANCE.MISSIONS.FIELDS.RATE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'totalAmount',
      label: 'Total',
      labelTranslatePath: 'MAINTENANCE.MISSIONS.FIELDS.TOTAL',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'scheduledStart',
      label: 'Start',
      labelTranslatePath: 'CONTRACT.START_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'invoiceReference',
      label: 'Invoice',
      labelTranslatePath: 'EXPENSES.FIELDS.INVOICE_REF',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

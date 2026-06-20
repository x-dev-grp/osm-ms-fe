import { SearchOperation } from '../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../shared/modules/osm-dashboard/models/dashboard-config';

export const MAINTENANCE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'handyman',
  title: '',
  titleTranslatePath: 'MENU.MAINTENANCE.WORK_ORDERS',
  baseURL: 'production/maintenance-work-orders',
  searchEndpoint: 'production/maintenance-work-orders',
  addNewItem: true,
  addNewItemUrl: '/maintenance/new',
  fileName: 'maintenance_work_orders',
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
      name: 'assetName',
      label: 'Asset',
      labelTranslatePath: 'MAINTENANCE.FIELDS.ASSET',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'assetType',
      label: 'Asset type',
      labelTranslatePath: 'MAINTENANCE.FIELDS.ASSET_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'MILL_MACHINE', label: 'Mill machine', labelTranslatePath: 'MAINTENANCE.ASSET_TYPE.MILL_MACHINE' },
        { value: 'STORAGE_UNIT', label: 'Storage unit', labelTranslatePath: 'MAINTENANCE.ASSET_TYPE.STORAGE_UNIT' },
        {
          value: 'LIGNE_CONDITIONNEMENT',
          label: 'Packaging line',
          labelTranslatePath: 'MAINTENANCE.ASSET_TYPE.LIGNE_CONDITIONNEMENT'
        }
      ]
    },
    {
      name: 'maintenanceType',
      label: 'Type',
      labelTranslatePath: 'MAINTENANCE.FIELDS.TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'PREVENTIVE', label: 'Preventive', labelTranslatePath: 'MAINTENANCE.TYPE.PREVENTIVE' },
        { value: 'CORRECTIVE', label: 'Corrective', labelTranslatePath: 'MAINTENANCE.TYPE.CORRECTIVE' },
        { value: 'PREDICTIVE', label: 'Predictive', labelTranslatePath: 'MAINTENANCE.TYPE.PREDICTIVE' }
      ]
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
      options: [
        { value: 'PLANNED', label: 'Planned', labelTranslatePath: 'MAINTENANCE.STATUS.PLANNED' },
        { value: 'IN_PROGRESS', label: 'In progress', labelTranslatePath: 'MAINTENANCE.STATUS.IN_PROGRESS' },
        { value: 'COMPLETED', label: 'Completed', labelTranslatePath: 'MAINTENANCE.STATUS.COMPLETED' },
        { value: 'CANCELLED', label: 'Cancelled', labelTranslatePath: 'MAINTENANCE.STATUS.CANCELLED' }
      ]
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
      name: 'totalCost',
      label: 'Total cost',
      labelTranslatePath: 'MAINTENANCE.FIELDS.TOTAL_COST',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
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
    },
    {
      name: 'technician',
      label: 'Technician',
      labelTranslatePath: 'AUTO.TECHNICIEN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

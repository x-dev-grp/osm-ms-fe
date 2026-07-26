import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const WORK_SCHEDULES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'event_repeat',
  title: 'work-schedules',
  titleTranslatePath: 'HR.PAGE.WORK_SCHEDULES.TITLE',
  baseURL: 'hr/work-schedules',
  searchEndpoint: 'hr/work-schedules',
  addNewItem: true,
  addNewItemUrl: '/hr/work-schedules/new',
  fileName: 'work-schedules',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: { isDeleted: { equalValue: false } }
    }
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      labelTranslatePath: 'HR.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'scheduleCode',
      label: 'Code',
      labelTranslatePath: 'HR.FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'weeklyHours',
      label: 'Weekly hours',
      labelTranslatePath: 'HR.FIELDS.WEEKLY_HOURS',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'workingDays',
      label: 'Working days',
      labelTranslatePath: 'HR.FIELDS.WORKING_DAYS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'active',
      label: 'Active',
      labelTranslatePath: 'HR.FIELDS.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

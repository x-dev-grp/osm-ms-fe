import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HR_EMPLOYEE_FIRST_NAME_FIELD, HR_EMPLOYEE_LAST_NAME_FIELD } from './hr-nested-dashboard.fields';

export const LEAVE_REQUEST_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'event_busy',
  title: 'Leave requests',
  titleTranslatePath: 'HR.PAGE.LEAVE.TITLE',
  baseURL: 'hr/leave-requests',
  searchEndpoint: 'hr/leave-requests',
  addNewItem: true,
  addNewItemUrl: '/hr/leave-requests/new',
  fileName: 'leave_requests',
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
    HR_EMPLOYEE_FIRST_NAME_FIELD,
    HR_EMPLOYEE_LAST_NAME_FIELD,
    {
      name: 'leaveType',
      label: 'Type',
      labelTranslatePath: 'HR.LEAVES.FIELDS.TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'ANNUAL', label: 'Annual', labelTranslatePath: 'HR.LEAVES.TYPE.ANNUAL' },
        { value: 'SICK', label: 'Sick', labelTranslatePath: 'HR.LEAVES.TYPE.SICK' },
        { value: 'UNPAID', label: 'Unpaid', labelTranslatePath: 'HR.LEAVES.TYPE.UNPAID' },
        { value: 'MATERNITY', label: 'Maternity', labelTranslatePath: 'HR.LEAVES.TYPE.MATERNITY' },
        { value: 'PATERNITY', label: 'Paternity', labelTranslatePath: 'HR.LEAVES.TYPE.PATERNITY' },
        { value: 'OTHER', label: 'Other', labelTranslatePath: 'HR.LEAVES.TYPE.OTHER' }
      ]
    },
    {
      name: 'startDate',
      label: 'Start',
      labelTranslatePath: 'HR.LEAVES.FIELDS.START_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'endDate',
      label: 'End',
      labelTranslatePath: 'HR.LEAVES.FIELDS.END_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'durationDays',
      label: 'Duration',
      labelTranslatePath: 'HR.LEAVES.FIELDS.DURATION',
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
      labelTranslatePath: 'HR.LEAVES.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'PENDING', label: 'Pending', labelTranslatePath: 'HR.LEAVES.STATUS.PENDING' },
        { value: 'APPROVED', label: 'Approved', labelTranslatePath: 'HR.LEAVES.STATUS.APPROVED' },
        { value: 'REJECTED', label: 'Rejected', labelTranslatePath: 'HR.LEAVES.STATUS.REJECTED' },
        { value: 'CANCELLED', label: 'Cancelled', labelTranslatePath: 'HR.LEAVES.STATUS.CANCELLED' }
      ]
    }
  ]
};

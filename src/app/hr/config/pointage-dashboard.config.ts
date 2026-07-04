import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HR_EMPLOYEE_FIRST_NAME_FIELD, HR_EMPLOYEE_LAST_NAME_FIELD } from './hr-nested-dashboard.fields';

export const POINTAGE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'schedule',
  title: 'Attendance',
  titleTranslatePath: 'HR.PAGE.POINTAGE.TITLE',
  baseURL: 'hr/pointages',
  searchEndpoint: 'hr/pointages',
  addNewItem: true,
  addNewItemUrl: '/hr/pointages/new',
  fileName: 'pointages',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'workDate',
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
      name: 'workDate',
      label: 'Date',
      labelTranslatePath: 'HR.ATTENDANCE.FIELDS.WORK_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'checkIn',
      label: 'Check-in',
      labelTranslatePath: 'HR.ATTENDANCE.FIELDS.CHECK_IN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'checkOut',
      label: 'Check-out',
      labelTranslatePath: 'HR.ATTENDANCE.FIELDS.CHECK_OUT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'workedHours',
      label: 'Worked hours',
      labelTranslatePath: 'HR.ATTENDANCE.FIELDS.WORKED_HOURS',
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
      labelTranslatePath: 'HR.ATTENDANCE.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'PRESENT', label: 'Present', labelTranslatePath: 'HR.ATTENDANCE.STATUS.PRESENT' },
        { value: 'ABSENT', label: 'Absent', labelTranslatePath: 'HR.ATTENDANCE.STATUS.ABSENT' },
        { value: 'HALF_DAY', label: 'Half day', labelTranslatePath: 'HR.ATTENDANCE.STATUS.HALF_DAY' },
        { value: 'LEAVE', label: 'Leave', labelTranslatePath: 'HR.ATTENDANCE.STATUS.LEAVE' },
        { value: 'PUBLIC_HOLIDAY', label: 'Public holiday', labelTranslatePath: 'HR.ATTENDANCE.STATUS.PUBLIC_HOLIDAY' }
      ]
    }
  ]
};

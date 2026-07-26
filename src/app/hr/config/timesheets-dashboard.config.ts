import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HR_EMPLOYEE_FIRST_NAME_FIELD, HR_EMPLOYEE_LAST_NAME_FIELD } from './hr-nested-dashboard.fields';

export const TIMESHEETS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'pending_actions',
  title: 'timesheets',
  titleTranslatePath: 'HR.PAGE.TIMESHEETS.TITLE',
  baseURL: 'hr/timesheets',
  searchEndpoint: 'hr/timesheets',
  addNewItem: true,
  addNewItemUrl: '/hr/timesheets/new',
  fileName: 'timesheets',
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
      name: 'periodYear',
      label: 'Year',
      labelTranslatePath: 'HR.PAYROLL.FIELDS.YEAR',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'periodMonth',
      label: 'Month',
      labelTranslatePath: 'HR.PAYROLL.FIELDS.MONTH',
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
      labelTranslatePath: 'HR.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'totalWorkedMinutes',
      label: 'Worked minutes',
      labelTranslatePath: 'HR.FIELDS.WORKED_MINUTES',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HR_EMPLOYEE_FIRST_NAME_FIELD, HR_EMPLOYEE_LAST_NAME_FIELD } from './hr-nested-dashboard.fields';

export const SALARY_ADVANCES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'payments',
  title: 'salary-advances',
  titleTranslatePath: 'HR.PAGE.SALARY_ADVANCES.TITLE',
  baseURL: 'hr/salary-advances',
  searchEndpoint: 'hr/salary-advances',
  addNewItem: true,
  addNewItemUrl: '/hr/salary-advances/new',
  fileName: 'salary-advances',
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
      name: 'amount',
      label: 'Amount',
      labelTranslatePath: 'HR.FIELDS.AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'requestDate',
      label: 'Request date',
      labelTranslatePath: 'HR.FIELDS.REQUEST_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
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
    }
  ]
};

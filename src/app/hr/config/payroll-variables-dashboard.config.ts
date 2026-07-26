import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HR_EMPLOYEE_FIRST_NAME_FIELD, HR_EMPLOYEE_LAST_NAME_FIELD } from './hr-nested-dashboard.fields';

export const PAYROLL_VARIABLES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'tune',
  title: 'payroll-variables',
  titleTranslatePath: 'HR.PAGE.PAYROLL_VARIABLES.TITLE',
  baseURL: 'hr/payroll-variables',
  searchEndpoint: 'hr/payroll-variables',
  addNewItem: true,
  addNewItemUrl: '/hr/payroll-variables/new',
  fileName: 'payroll-variables',
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
      name: 'year',
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
      name: 'month',
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
      name: 'type',
      label: 'Type',
      labelTranslatePath: 'HR.FIELDS.TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
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

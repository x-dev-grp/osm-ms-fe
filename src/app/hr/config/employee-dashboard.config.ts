import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const EMPLOYEE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'groups',
  title: 'Employees',
  titleTranslatePath: 'HR.PAGE.EMPLOYEES.TITLE',
  baseURL: 'hr/employees',
  searchEndpoint: 'hr/employees',
  addNewItem: true,
  addNewItemUrl: '/hr/employees/new',
  fileName: 'employees',
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
      name: 'firstName',
      label: 'First name',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.FIRST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lastName',
      label: 'Last name',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.LAST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'cin',
      label: 'CIN',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.CIN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'cnssMatricule',
      label: 'CNSS',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.CNSS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'jobTitle',
      label: 'Job title',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.JOB_TITLE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'department',
      label: 'Department',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.DEPARTMENT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Status',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'ACTIVE', label: 'Active', labelTranslatePath: 'HR.EMPLOYEES.STATUS.ACTIVE' },
        { value: 'SUSPENDED', label: 'Suspended', labelTranslatePath: 'HR.EMPLOYEES.STATUS.SUSPENDED' },
        { value: 'TERMINATED', label: 'Terminated', labelTranslatePath: 'HR.EMPLOYEES.STATUS.TERMINATED' }
      ]
    },
    {
      name: 'hireDate',
      label: 'Hire date',
      labelTranslatePath: 'HR.EMPLOYEES.FIELDS.HIRE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

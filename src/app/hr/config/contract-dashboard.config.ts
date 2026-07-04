import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import {
  HR_EMPLOYEE_FIRST_NAME_FIELD,
  HR_EMPLOYEE_LAST_NAME_FIELD,
  HR_POSTE_TITLE_FIELD
} from './hr-nested-dashboard.fields';

export const CONTRACT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'description',
  title: 'Contracts',
  titleTranslatePath: 'HR.PAGE.CONTRACTS.TITLE',
  baseURL: 'hr/contracts',
  searchEndpoint: 'hr/contracts',
  addNewItem: true,
  addNewItemUrl: '/hr/contracts/new',
  fileName: 'contracts',
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
    HR_POSTE_TITLE_FIELD,
    {
      name: 'contractType',
      label: 'Type',
      labelTranslatePath: 'HR.CONTRACTS.FIELDS.TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'CDI', label: 'CDI', labelTranslatePath: 'HR.CONTRACTS.TYPE.CDI' },
        { value: 'CDD', label: 'CDD', labelTranslatePath: 'HR.CONTRACTS.TYPE.CDD' },
        { value: 'INTERNSHIP', label: 'Internship', labelTranslatePath: 'HR.CONTRACTS.TYPE.INTERNSHIP' },
        { value: 'TEMPORARY', label: 'Temporary', labelTranslatePath: 'HR.CONTRACTS.TYPE.TEMPORARY' }
      ]
    },
    {
      name: 'startDate',
      label: 'Start',
      labelTranslatePath: 'HR.CONTRACTS.FIELDS.START_DATE',
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
      labelTranslatePath: 'HR.CONTRACTS.FIELDS.END_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'salary',
      label: 'Salary',
      labelTranslatePath: 'HR.CONTRACTS.FIELDS.SALARY',
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
      labelTranslatePath: 'HR.CONTRACTS.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'DRAFT', label: 'Draft', labelTranslatePath: 'HR.CONTRACTS.STATUS.DRAFT' },
        { value: 'ACTIVE', label: 'Active', labelTranslatePath: 'HR.CONTRACTS.STATUS.ACTIVE' },
        { value: 'EXPIRED', label: 'Expired', labelTranslatePath: 'HR.CONTRACTS.STATUS.EXPIRED' },
        { value: 'TERMINATED', label: 'Terminated', labelTranslatePath: 'HR.CONTRACTS.STATUS.TERMINATED' }
      ]
    }
  ]
};

import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import {
  HR_EMPLOYEE_FIRST_NAME_FIELD,
  HR_EMPLOYEE_LAST_NAME_FIELD,
  HR_PAYROLL_PERIOD_FILTER_FIELD,
  HR_PAYROLL_PERIOD_MONTH_FIELD,
  HR_PAYROLL_PERIOD_YEAR_FIELD
} from './hr-nested-dashboard.fields';

export const PAYSLIP_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'receipt_long',
  title: 'Payslips',
  titleTranslatePath: 'HR.PAYSLIPS.LIST_TITLE',
  baseURL: 'hr/payslips',
  searchEndpoint: 'hr/payslips',
  addNewItem: true,
  addNewItemUrl: '/hr/payslips/new',
  fileName: 'payslips',
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
    HR_PAYROLL_PERIOD_FILTER_FIELD,
    HR_PAYROLL_PERIOD_YEAR_FIELD,
    HR_PAYROLL_PERIOD_MONTH_FIELD,
    {
      name: 'grossSalary',
      label: 'Gross',
      labelTranslatePath: 'HR.PAYSLIPS.FIELDS.GROSS_SALARY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'netSalary',
      label: 'Net',
      labelTranslatePath: 'HR.PAYSLIPS.FIELDS.NET_SALARY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'paid',
      label: 'Paid',
      labelTranslatePath: 'HR.PAYSLIPS.FIELDS.STATUS',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'paymentDate',
      label: 'Payment date',
      labelTranslatePath: 'HR.PAYSLIPS.FIELDS.PAYMENT_DATE',
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
      labelTranslatePath: 'HR.PAYSLIPS.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'DRAFT', label: 'Draft', labelTranslatePath: 'HR.PAYSLIPS.STATUS.DRAFT' },
        { value: 'VALIDATED', label: 'Validated', labelTranslatePath: 'HR.PAYSLIPS.STATUS.VALIDATED' },
        { value: 'PAID', label: 'Paid', labelTranslatePath: 'HR.PAYSLIPS.STATUS.PAID' }
      ]
    }
  ]
};

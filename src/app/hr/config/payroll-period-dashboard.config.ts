import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const PAYROLL_PERIOD_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'calendar_month',
  title: 'Payroll periods',
  titleTranslatePath: 'HR.PAGE.PAYROLL.TITLE',
  baseURL: 'hr/payroll-periods',
  searchEndpoint: 'hr/payroll-periods',
  addNewItem: true,
  addNewItemUrl: '/hr/payroll-periods/new',
  fileName: 'payroll_periods',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'periodStart',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: { isDeleted: { equalValue: false } }
    }
  },
  fields: [
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
      name: 'periodStart',
      label: 'Start',
      labelTranslatePath: 'HR.PAYROLL.FIELDS.START_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'periodEnd',
      label: 'End',
      labelTranslatePath: 'HR.PAYROLL.FIELDS.END_DATE',
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
      labelTranslatePath: 'HR.PAYROLL.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'OPEN', label: 'Open', labelTranslatePath: 'HR.PAYROLL.STATUS.OPEN' },
        { value: 'CALCULATED', label: 'Calculated', labelTranslatePath: 'HR.PAYROLL.STATUS.CALCULATED' },
        { value: 'VALIDATED', label: 'Validated', labelTranslatePath: 'HR.PAYROLL.STATUS.VALIDATED' },
        { value: 'PAID', label: 'Paid', labelTranslatePath: 'HR.PAYROLL.STATUS.PAID' },
        { value: 'CLOSED', label: 'Closed', labelTranslatePath: 'HR.PAYROLL.STATUS.CLOSED' }
      ]
    }
  ]
};

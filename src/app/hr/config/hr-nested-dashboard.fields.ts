import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, Field, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

const notDeletedSearch = {
  isDeleted: { equalValue: false }
};

const employeeAutocompleteCriteria = {
  page: 0,
  size: 10,
  sort: 'lastName',
  order: 'DESC' as const,
  searchData: {
    operation: SearchOperation.AND,
    searchs: [],
    search: notDeletedSearch
  }
};

const posteAutocompleteCriteria = {
  page: 0,
  size: 10,
  sort: 'title',
  order: 'ASC' as const,
  searchData: {
    operation: SearchOperation.AND,
    searchs: [],
    search: notDeletedSearch
  }
};

const payrollPeriodAutocompleteCriteria = {
  page: 0,
  size: 10,
  sort: 'periodStart',
  order: 'DESC' as const,
  searchData: {
    operation: SearchOperation.AND,
    searchs: [],
    search: notDeletedSearch
  }
};

/** Employee first name column + autocomplete filter (filters by employee.id). */
export const HR_EMPLOYEE_FIRST_NAME_FIELD: Field = {
  name: 'employee',
  valuePath: 'firstName',
  label: 'First name',
  labelTranslatePath: 'HR.EMPLOYEES.FIELDS.FIRST_NAME',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.string,
  fieldType: FieldType.autocomplete,
  exportable: true,
  sortable: false,
  dataTable: true,
  filterable: true,
  filterAttribute: 'employee.firstName',
  getOptionsUrl: 'hr/employees',
  autoCompleteFilterAttributes: ['firstName', 'lastName'],
  autoCompleteDefaultCriteria: employeeAutocompleteCriteria
};

/** Employee last name column (display only). */
export const HR_EMPLOYEE_LAST_NAME_FIELD: Field = {
  name: 'employee',
  valuePath: 'lastName',
  label: 'Last name',
  labelTranslatePath: 'HR.EMPLOYEES.FIELDS.LAST_NAME',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.string,
  fieldType: FieldType.text,
  exportable: true,
  sortable: false,
  dataTable: true,
  filterable: false
};

/** Poste title on employment contracts. */
export const HR_POSTE_TITLE_FIELD: Field = {
  name: 'poste',
  valuePath: 'title',
  label: 'Position',
  labelTranslatePath: 'HR.CONTRACTS.FIELDS.POSTE',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.string,
  fieldType: FieldType.autocomplete,
  exportable: true,
  sortable: false,
  dataTable: true,
  filterable: true,
  filterAttribute: 'poste.title',
  getOptionsUrl: 'hr/postes',
  autoCompleteFilterAttributes: ['title'],
  autoCompleteDefaultCriteria: posteAutocompleteCriteria
};

/** Payroll period year (display). */
export const HR_PAYROLL_PERIOD_YEAR_FIELD: Field = {
  name: 'payrollPeriod',
  valuePath: 'year',
  label: 'Year',
  labelTranslatePath: 'HR.PAYROLL.FIELDS.YEAR',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.number,
  fieldType: FieldType.text,
  exportable: true,
  sortable: false,
  dataTable: true,
  filterable: false
};

/** Payroll period month (display). */
export const HR_PAYROLL_PERIOD_MONTH_FIELD: Field = {
  name: 'payrollPeriod',
  valuePath: 'month',
  label: 'Month',
  labelTranslatePath: 'HR.PAYROLL.FIELDS.MONTH',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.number,
  fieldType: FieldType.text,
  exportable: true,
  sortable: false,
  dataTable: true,
  filterable: false
};

/** Payroll period filter (filters by payrollPeriod.id). */
export const HR_PAYROLL_PERIOD_FILTER_FIELD: Field = {
  name: 'payrollPeriod',
  valuePath: 'year',
  label: 'Payroll period',
  labelTranslatePath: 'HR.PAGE.PAYROLL.TITLE',
  attributeType: AttributeType.object,
  valueAttributeType: AttributeType.number,
  fieldType: FieldType.autocomplete,
  exportable: false,
  sortable: false,
  dataTable: false,
  filterable: true,
  filterAttribute: 'payrollPeriod.year',
  getOptionsUrl: 'hr/payroll-periods',
  autoCompleteFilterAttributes: ['year', 'month'],
  autoCompleteDefaultCriteria: payrollPeriodAutocompleteCriteria
};

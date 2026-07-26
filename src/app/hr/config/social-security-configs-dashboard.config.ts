import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const SOCIAL_SECURITY_CONFIGS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'health_and_safety',
  title: 'social-security-configs',
  titleTranslatePath: 'HR.PAGE.SOCIAL_SECURITY.TITLE',
  baseURL: 'hr/social-security-configs',
  searchEndpoint: 'hr/social-security-configs',
  addNewItem: true,
  addNewItemUrl: '/hr/social-security-configs/new',
  fileName: 'social-security-configs',
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
      name: 'regime',
      label: 'Regime',
      labelTranslatePath: 'HR.FIELDS.REGIME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'employeeRate',
      label: 'Employee rate',
      labelTranslatePath: 'HR.FIELDS.EMPLOYEE_RATE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'employerRate',
      label: 'Employer rate',
      labelTranslatePath: 'HR.FIELDS.EMPLOYER_RATE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'cssRate',
      label: 'CSS rate',
      labelTranslatePath: 'HR.FIELDS.CSS_RATE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'active',
      label: 'Active',
      labelTranslatePath: 'HR.FIELDS.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

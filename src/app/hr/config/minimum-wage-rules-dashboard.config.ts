import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const MINIMUM_WAGE_RULES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'trending_up',
  title: 'minimum-wage-rules',
  titleTranslatePath: 'HR.PAGE.MINIMUM_WAGE.TITLE',
  baseURL: 'hr/minimum-wage-rules',
  searchEndpoint: 'hr/minimum-wage-rules',
  addNewItem: true,
  addNewItemUrl: '/hr/minimum-wage-rules/new',
  fileName: 'minimum-wage-rules',
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
      name: 'profile',
      label: 'Profile',
      labelTranslatePath: 'HR.FIELDS.PROFILE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'weeklyRegime',
      label: 'Regime',
      labelTranslatePath: 'HR.FIELDS.WEEKLY_REGIME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'monthlyMinimum',
      label: 'Monthly min',
      labelTranslatePath: 'HR.FIELDS.MONTHLY_MINIMUM',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'hourlyMinimum',
      label: 'Hourly min',
      labelTranslatePath: 'HR.FIELDS.HOURLY_MINIMUM',
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

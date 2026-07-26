import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const TAX_CONFIGURATIONS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'receipt',
  title: 'tax-configurations',
  titleTranslatePath: 'HR.PAGE.TAX_CONFIG.TITLE',
  baseURL: 'hr/tax-configurations',
  searchEndpoint: 'hr/tax-configurations',
  addNewItem: true,
  addNewItemUrl: '/hr/tax-configurations/new',
  fileName: 'tax-configurations',
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
      name: 'fiscalYear',
      label: 'Fiscal year',
      labelTranslatePath: 'HR.FIELDS.FISCAL_YEAR',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'HR.FIELDS.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'effectiveFrom',
      label: 'Effective from',
      labelTranslatePath: 'HR.FIELDS.EFFECTIVE_FROM',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
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

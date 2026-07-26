import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const LEGAL_RULES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'gavel',
  title: 'legal-rules',
  titleTranslatePath: 'HR.PAGE.LEGAL_RULES.TITLE',
  baseURL: 'hr/legal-rules',
  searchEndpoint: 'hr/legal-rules',
  addNewItem: true,
  addNewItemUrl: '/hr/legal-rules/new',
  fileName: 'legal-rules',
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
      name: 'code',
      label: 'Code',
      labelTranslatePath: 'HR.FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'category',
      label: 'Category',
      labelTranslatePath: 'HR.FIELDS.CATEGORY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'value',
      label: 'Value',
      labelTranslatePath: 'HR.FIELDS.VALUE',
      attributeType: AttributeType.number,
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

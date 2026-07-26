import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const LEAVE_TYPES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'category',
  title: 'leave-types',
  titleTranslatePath: 'HR.PAGE.LEAVE_TYPES.TITLE',
  baseURL: 'hr/leave-types',
  searchEndpoint: 'hr/leave-types',
  addNewItem: true,
  addNewItemUrl: '/hr/leave-types/new',
  fileName: 'leave-types',
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
      name: 'nameFr',
      label: 'Name (FR)',
      labelTranslatePath: 'HR.FIELDS.NAME_FR',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'annualAllowance',
      label: 'Allowance',
      labelTranslatePath: 'HR.FIELDS.ANNUAL_ALLOWANCE',
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
      labelTranslatePath: 'HR.FIELDS.PAID',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
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

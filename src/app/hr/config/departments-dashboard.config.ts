import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const DEPARTMENTS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'account_tree',
  title: 'departments',
  titleTranslatePath: 'HR.PAGE.DEPARTMENTS.TITLE',
  baseURL: 'hr/departments',
  searchEndpoint: 'hr/departments',
  addNewItem: true,
  addNewItemUrl: '/hr/departments/new',
  fileName: 'departments',
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
      name: 'name',
      label: 'Name',
      labelTranslatePath: 'HR.FIELDS.NAME',
      attributeType: AttributeType.string,
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

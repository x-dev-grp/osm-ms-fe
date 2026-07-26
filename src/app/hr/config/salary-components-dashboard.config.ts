import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const SALARY_COMPONENTS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'toll',
  title: 'salary-components',
  titleTranslatePath: 'HR.PAGE.SALARY_COMPONENTS.TITLE',
  baseURL: 'hr/salary-components',
  searchEndpoint: 'hr/salary-components',
  addNewItem: true,
  addNewItemUrl: '/hr/salary-components/new',
  fileName: 'salary-components',
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
      name: 'labelFr',
      label: 'Label',
      labelTranslatePath: 'HR.FIELDS.LABEL_FR',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'type',
      label: 'Type',
      labelTranslatePath: 'HR.FIELDS.COMPONENT_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'calculationType',
      label: 'Calculation',
      labelTranslatePath: 'HR.FIELDS.CALCULATION_TYPE',
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

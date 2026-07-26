import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const PUBLIC_HOLIDAYS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'celebration',
  title: 'public-holidays',
  titleTranslatePath: 'HR.PAGE.PUBLIC_HOLIDAYS.TITLE',
  baseURL: 'hr/public-holidays',
  searchEndpoint: 'hr/public-holidays',
  addNewItem: true,
  addNewItemUrl: '/hr/public-holidays/new',
  fileName: 'public-holidays',
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
      name: 'date',
      label: 'Date',
      labelTranslatePath: 'HR.FIELDS.DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
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
      name: 'legal',
      label: 'Legal',
      labelTranslatePath: 'HR.FIELDS.LEGAL',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'effectiveYear',
      label: 'Year',
      labelTranslatePath: 'HR.PAYROLL.FIELDS.YEAR',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

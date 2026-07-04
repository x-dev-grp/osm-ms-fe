import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';

export const POSTE_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'badge',
  title: 'Positions',
  titleTranslatePath: 'HR.PAGE.POSITIONS.TITLE',
  baseURL: 'hr/postes',
  searchEndpoint: 'hr/postes',
  addNewItem: true,
  addNewItemUrl: '/hr/postes/new',
  fileName: 'postes',
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
      name: 'title',
      label: 'Title',
      labelTranslatePath: 'POSTE.NAME',
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
      labelTranslatePath: 'POSTE.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ]
};

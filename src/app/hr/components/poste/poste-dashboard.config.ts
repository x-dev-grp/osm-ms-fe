import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'work',
  title: 'Liste des postes',
  titleTranslatePath: 'AUTO.LISTE_DES_POSTES',
  baseURL: 'hr/poste',
  searchEndpoint: 'hr/poste',
  addNewItem: true,
  addNewItemUrl: 'hr/poste/new',
  fileName: 'postes',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'name',
    order: 'ASC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: { equalValue: false }
      }
    }
  },

  fields: [
    {
      name: 'name',
      label: 'Nom du poste',
      labelTranslatePath: 'POSTE.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'name'
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'POSTE.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      exportLabel: 'description'
    },

  ]
};

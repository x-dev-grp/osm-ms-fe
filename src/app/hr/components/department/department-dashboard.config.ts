import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'business',
  title: 'Liste des départements',
  baseURL: 'hr/department',
  searchEndpoint: 'hr/department',
  addNewItem: true,
  addNewItemUrl: 'hr/department/new',
  fileName: 'departments',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
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
      label: 'Nom du département',
      labelTranslatePath: 'DEPARTMENT.DASHBOARD.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'DEPARTMENT.DASHBOARD.FIELDS.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: false, // Description est souvent longue -> pas en table
      exportable: true
    },
    // {
    //   name: 'managerId',
    //   label: 'Manager ID',
    //   labelTranslatePath: 'DEPARTMENT.DASHBOARD.FIELDS.MANAGER_ID',
    //   attributeType: AttributeType.number,
    //   fieldType: FieldType.number,
    //   sortable: true,
    //   filterable: true,
    //   defaultFilter: false,
    //   dataTable: true,
    //   exportable: true
    // },
    {
      name: 'employees',
      label: 'Nombre d\'employés',
      labelTranslatePath: 'DEPARTMENT.DASHBOARD.FIELDS.EMPLOYEES_COUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: false,
      filterable: false,
      defaultFilter: false,
      dataTable: true,
      exportable: true,

    }
  ]
};

import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const userDashboardConfig: DashboardConfig = {
  title: 'Gestion des utilisateurs',
  baseURL: 'security/user',
  searchEndpoint: 'security/user',
  addNewItem: true,
  addNewItemUrl: 'settings/users/add',
  fileName: 'utilisateur',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  },
  fields: [
    {
      name: 'username',
      label: "Nom d'utilisateur",
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'email',
      label: 'Email',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'phoneNumber',
      label: 'Numéro de téléphone',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'confirmationMethod',
      label: 'Méthode de confirmation',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [
        {
          label: 'Email',
          value: 'EMAIL',labelTranslatePath:'EMPLOYEE.EMAIL'
        },
        {
          label: 'Téléphone',
          value: 'PHONE',labelTranslatePath:'EMPLOYEE.PHONE'
        }
      ]
    },
    {
      name: 'locked',
      booleanAttributeName: 'isLocked',
      label: 'Désactiver',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'role',
      label: 'Role',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      getOptionsUrl: 'security/role',
      valuePath: 'roleName'
    }
  ]
};

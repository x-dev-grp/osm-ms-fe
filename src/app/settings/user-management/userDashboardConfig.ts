import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const userDashboardConfig: DashboardConfig = {
  title: 'Gestion des utilisateurs',
  titleTranslatePath: 'MENU.ADMINISTRATION.USERS',
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
      labelTranslatePath: 'ADMIN_USERS.FIELDS.USERNAME',
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
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.EMAIL',
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
      labelTranslatePath: 'AUTO.NUMERO_DE_TELEPHONE',
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
      labelTranslatePath: 'ADMIN_USERS.FIELDS.CONFIRMATION_METHOD',
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
          value: 'EMAIL',
          labelTranslatePath: 'EMPLOYEE.EMAIL'
        },
        {
          label: 'Téléphone',
          value: 'PHONE',
          labelTranslatePath: 'EMPLOYEE.PHONE'
        }
      ]
    },
    {
      name: 'locked',
      booleanAttributeName: 'isLocked',
      label: 'Désactiver',
      labelTranslatePath: 'AUTO.DESACTIVER',
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
      labelTranslatePath: 'ADMIN.ADD_OSM_ADMIN_ROLE',
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

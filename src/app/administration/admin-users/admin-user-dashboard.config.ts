import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const adminUserDashboardConfig: DashboardConfig = {
  icon: 'group',
  title: 'All Users',
  titleTranslatePath: 'ADMIN_USERS.TITLE',
  baseURL: 'security/user',
  searchEndpoint: 'security/user',
  addNewItem: false,
  filterTenant: false,
  fileName: 'admin-users',
  specificActions: [
    {
      action: 'READ',
      color: 'primary',
      icon: 'visibility'
    },
    {
      action: 'RESET_PASSWORD',
      color: 'warn',
      icon: 'lock_reset',
      disabled: {
        field: 'isLocked',
        value: true
      }
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    filterTenant: false,
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
      defaultFilter: true,
      dataTable: true,
      exportable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'ADMIN_USERS.FIELDS.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true
    },
    {
      name: 'phoneNumber',
      label: 'Phone',
      labelTranslatePath: 'ADMIN_USERS.FIELDS.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'role',
      label: 'Role',
      labelTranslatePath: 'ADMIN_USERS.FIELDS.ROLE',
      valuePath: 'roleName',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'tenantName',
      label: 'Tenant',
      labelTranslatePath: 'ADMIN_USERS.FIELDS.TENANT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: false,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'isLocked',
      label: 'Locked',
      labelTranslatePath: 'ADMIN_USERS.FIELDS.LOCKED',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    }
  ]
};

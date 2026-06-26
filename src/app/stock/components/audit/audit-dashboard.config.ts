import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const AUDIT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'history',
  title: 'Audit global',
  titleTranslatePath: 'AUTO.AUDIT_GLOBAL',
  baseURL: 'inventaire/audit',
  searchEndpoint: 'inventaire/audit',
  clientSide: true,
  hideActions: true,
  addNewItem: false,
  fileName: 'audit',
  countBadgeSuffixTranslatePath: 'AUTO.TOTAL_ACTIONS',
  fields: [
    {
      name: 'lastModifiedDate',
      label: 'Date modification',
      labelTranslatePath: 'AUTO.DATE_MODIFICATION',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      defaultFilter: true
    },
    {
      name: 'actionType',
      label: 'Type d’action',
      labelTranslatePath: 'AUTO.TYPE_D_ACTION',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      defaultFilter: true,
      options: [
        { value: 'CRÉATION', label: 'Création' },
        { value: 'MODIFICATION', label: 'Modification' }
      ]
    },
    {
      name: 'userSearch',
      label: 'Utilisateur',
      labelTranslatePath: 'OSM_DASHBOARD.ACTIONS.USER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: false,
      sortable: false,
      dataTable: false,
      filterable: true,
      defaultFilter: true
    },
    {
      name: 'entityDisplayName',
      label: 'Module métier',
      labelTranslatePath: 'AUTO.MODULE_METIER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      defaultFilter: true
    },
    {
      name: 'id',
      label: 'ID',
      labelTranslatePath: 'OIL_TRANSACTION.DETAILS.ID',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
    {
      name: 'createdBy',
      label: 'Créé par',
      labelTranslatePath: 'EXPENSES.FIELDS.CREATED_BY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
    {
      name: 'createdDate',
      label: 'Date création',
      labelTranslatePath: 'AUTO.DATE_CREATION',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true
    },
    {
      name: 'lastModifiedBy',
      label: 'Modifié par',
      labelTranslatePath: 'AUTO.MODIFIE_PAR',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 25,
    sort: 'lastModifiedDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {},
      searchs: []
    }
  }
};

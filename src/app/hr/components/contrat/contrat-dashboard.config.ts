import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'assignment',
  title: 'Liste des contrats',
  baseURL: 'hr/contract',
  searchEndpoint: 'hr/contract',
  addNewItem: true,
  addNewItemUrl: 'hr/contract/new',
  fileName: 'contracts',

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
      name: 'startDate',
      label: 'Date de début',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.START_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true
    },
    {
      name: 'endDate',
      label: 'Date de fin',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.END_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'salary',
      label: 'Salaire',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.SALARY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'contractType',
      label: 'Type de contrat',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.CONTRACT_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options:[
        {label:"INTERNSHIP", value:"INTERNSHIP"},
        {label:"CDI", value:"CDI"},
        {label:"CDD", value:"CDD"},
        {label:"TEMPORARY", value:"TEMPORARY"},
        {label:"STAGE", value:"STAGE"},

      ]
    },
    {
      name: 'contractStatus',
      label: 'Statut du contrat',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.CONTRACT_STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [

        {label: 'ACTIVE', value: 'ACTIVE', labelTranslatePath: 'CONTRAT.STATUS.ACTIVE'},
        {label: 'EXPIRED', value: 'EXPIRED', labelTranslatePath: 'CONTRAT.STATUS.EXPIRED'},
        {label: 'SUSPENDED', value: 'SUSPENDED', labelTranslatePath: 'CONTRAT.STATUS.SUSPENDED'}
      ]
    },
    {
      name: 'employee.firstName',
      label: 'Employé',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.EMPLOYEE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'poste.name',
      label: 'Poste',
      labelTranslatePath: 'CONTRACT.DASHBOARD.FIELDS.POSTE',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    }
  ]
};

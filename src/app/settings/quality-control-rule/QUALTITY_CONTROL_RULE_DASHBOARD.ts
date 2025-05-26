import {AttributeType, DashboardConfig, FieldType} from "../../shared/modules/osm-dashboard/models/dashboard-config";
import {SearchOperation} from "../../shared/models/advanced-search/searchOperation";


export const QUALTITY_CONTROL_RULE_DASHBOARD: DashboardConfig = {
  title: "Quality Control Rule",
  titleTranslatePath: 'QUALTITY.CONTROL_RULE',
  baseURL: 'quality-control',
  searchEndpoint: 'production/qualitycontrolrules',
  addNewItem: true,
  addNewItemUrl: 'settings/quality-control/new',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],

    }
  },
  fields: [
    {
      name: 'ruleName',
      label: 'Rule Name',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      sortable: true,
    },
    {
      name: 'ruleType',
      label: 'Type Rule',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      filterable: true,
      dataTable: true,
      options: [
        {label: 'NUMERIC', value: 'NUMERIC'},
        {label: 'STRING', value: 'STRING'},
        {label: 'BOOLEAN', value: 'BOOLEAN'}
      ],
      defaultFilter: true
    },
    {
      name: 'oilQc',
      label: 'Controle Qualtiy Oil ',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
  ],
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      {label: 'Consulter', icon: 'visibility', value: 'CONSULTER'},
      {label: 'Modifier', icon: 'edit', value: 'MODIFIER'},
      {label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER'},
    ]
  }
}

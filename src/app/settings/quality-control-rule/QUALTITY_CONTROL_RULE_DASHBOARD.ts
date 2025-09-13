import {AttributeType, DashboardConfig, FieldType} from "../../shared/modules/osm-dashboard/models/dashboard-config";
import {SearchOperation} from "../../shared/models/advanced-search/searchOperation";


export const QUALTITY_CONTROL_RULE_DASHBOARD: DashboardConfig = {
  icon: 'rule',
  title: "Quality Control Rule",
  titleTranslatePath: 'QUALITY_CONTROL_RULE.TITLE',
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
      labelTranslatePath: 'QUALITY_CONTROL_RULE.FIELDS.RULE_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      sortable: true,
    },
    {
      name: 'ruleType',
      label: 'Type Rule',
      labelTranslatePath: 'QUALITY_CONTROL_RULE.FIELDS.RULE_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      filterable: true,
      dataTable: true,
      options: [
        {label: 'NUMERIC', value: 'NUMERIC', labelTranslatePath: 'QUALITY_CONTROL_RULE.RULE_TYPES.NUMERIC'},
        {label: 'STRING', value: 'STRING', labelTranslatePath: 'QUALITY_CONTROL_RULE.RULE_TYPES.STRING'},
        {label: 'BOOLEAN', value: 'BOOLEAN', labelTranslatePath: 'QUALITY_CONTROL_RULE.RULE_TYPES.BOOLEAN'}
      ],
    },
    {
      name: 'oilQc',
      label: 'Controle Qualtiy Oil',
      labelTranslatePath: 'QUALITY_CONTROL_RULE.FIELDS.OIL_QC',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
  ],

}

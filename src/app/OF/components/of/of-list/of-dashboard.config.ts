import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const OF_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'precision_manufacturing',
  title: 'Ordres de fabrication',
  titleTranslatePath: 'DASHBOARD_TITLES.OF',
  countBadgeSuffix: 'OF',
  baseURL: 'ordreConditionement/of',
  searchEndpoint: 'ordreConditionement/of',
  addNewItem: true,
  addNewItemUrl: '/of/nouveau',
  fileName: 'ordres-fabrication',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'PRODUCTION', color: 'primary', icon: 'precision_manufacturing' },
    { action: 'QUALITY', color: 'primary', icon: 'fact_check' }
  ],
  fields: [
    {
      name: 'code',
      label: 'Code OF',
      labelTranslatePath: 'DASHBOARD_FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'statut',
      label: 'Statut',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'productName',
      label: 'Produit',
      labelTranslatePath: 'DASHBOARD_FIELDS.PRODUCT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'projectCode',
      label: 'Projet',
      labelTranslatePath: 'DASHBOARD_FIELDS.PROJECT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'ligneNom',
      label: 'Ligne',
      labelTranslatePath: 'DASHBOARD_FIELDS.LINE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteCible',
      label: 'Quantite cible',
      labelTranslatePath: 'DASHBOARD_FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteBonne',
      label: 'Quantite bonne',
      labelTranslatePath: 'DASHBOARD_FIELDS.GOOD_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteNC',
      label: 'Quantite NC',
      labelTranslatePath: 'DASHBOARD_FIELDS.NC_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'dateDebutPrevue',
      label: 'Debut prevu',
      labelTranslatePath: 'DASHBOARD_FIELDS.PLANNED_START',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdDate',
      label: 'Date de creation',
      labelTranslatePath: 'DASHBOARD_FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: { isDeleted: { equalValue: false } },
      searchs: []
    }
  }
};

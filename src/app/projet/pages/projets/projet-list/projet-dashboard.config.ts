import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const PROJET_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'assignment',
  title: 'Gestion des Projets',
  titleTranslatePath: 'DASHBOARD_TITLES.PROJECTS',
  baseURL: 'ordreConditionement/projets',
  searchEndpoint: 'ordreConditionement/projets',
  addNewItem: true,
  addNewItemUrl: '/projets/new',
  fileName: 'projets',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'EXPEDITION', color: 'primary', icon: 'local_shipping' },
    { action: 'ADD_OF', color: 'primary', icon: 'precision_manufacturing' },
    { action: 'STATUS', color: 'primary', icon: 'published_with_changes' },
    { action: 'REMOVE', color: 'warn', icon: 'delete' }
  ],
  fields: [
    {
      name: 'code',
      label: 'Code',
      labelTranslatePath: 'DASHBOARD_FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'client.nom',
      label: 'Client',
      labelTranslatePath: 'DASHBOARD_FIELDS.CLIENT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'typeProduit',
      label: 'Produit',
      labelTranslatePath: 'DASHBOARD_FIELDS.PRODUCT',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'typeEmballage',
      label: 'Emballage',
      labelTranslatePath: 'DASHBOARD_FIELDS.PACKAGING',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteCible',
      label: 'Quantite',
      labelTranslatePath: 'DASHBOARD_FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unite',
      label: 'Unite',
      labelTranslatePath: 'DASHBOARD_FIELDS.UNIT',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'dateLimiteLivraison',
      label: 'Date limite',
      labelTranslatePath: 'DASHBOARD_FIELDS.DEADLINE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'valeurTotale',
      label: 'Valeur totale',
      labelTranslatePath: 'DASHBOARD_FIELDS.TOTAL_VALUE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
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

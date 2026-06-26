import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const EXPEDITION_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'local_shipping',
  title: 'Gestion des Expeditions',
  titleTranslatePath: 'DASHBOARD_TITLES.EXPEDITIONS',
  baseURL: 'expeditions',
  searchEndpoint: 'expeditions',
  addNewItem: false,
  fileName: 'expeditions',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'TRACEABILITY', color: 'primary', icon: 'account_tree' }
  ],
  fields: [
    {
      name: 'expeditionNumber',
      label: 'Numero',
      labelTranslatePath: 'DASHBOARD_FIELDS.NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'projetCode',
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
      name: 'destination',
      label: 'Destination',
      labelTranslatePath: 'DASHBOARD_FIELDS.DESTINATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'plannedShipDate',
      label: 'Date expedition',
      labelTranslatePath: 'DASHBOARD_FIELDS.SHIP_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'totalQuantity',
      label: 'Quantite totale',
      labelTranslatePath: 'DASHBOARD_FIELDS.TOTAL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'totalVolume',
      label: 'Volume total',
      labelTranslatePath: 'DASHBOARD_FIELDS.TOTAL_VOLUME',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
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

import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const LABEL_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'sell',
  title: 'Etiquettes',
  titleTranslatePath: 'DASHBOARD_TITLES.LABELS',
  baseURL: 'ordreConditionement/label-contents',
  searchEndpoint: 'ordreConditionement/label-contents',
  addNewItem: true,
  addNewItemUrl: '/labels/new',
  fileName: 'labels',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'FINALIZE', color: 'primary', icon: 'check_circle' },
    { action: 'EXPORT', color: 'primary', icon: 'download' },
    { action: 'DRAFT', color: 'primary', icon: 'undo' },
    { action: 'REMOVE', color: 'warn', icon: 'delete' }
  ],
  fields: [
    {
      name: 'lotNumber',
      label: 'Lot',
      labelTranslatePath: 'DASHBOARD_FIELDS.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'legalDenomination',
      label: 'Denomination',
      labelTranslatePath: 'DASHBOARD_FIELDS.DENOMINATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'netQuantity',
      label: 'Quantite',
      labelTranslatePath: 'DASHBOARD_FIELDS.QUANTITY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'packagingDate',
      label: 'Date conditionnement',
      labelTranslatePath: 'DASHBOARD_FIELDS.PACKAGING_DATE',
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
    },
    {
      name: 'labelCategory',
      label: 'Categorie',
      labelTranslatePath: 'DASHBOARD_FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'UNIT', label: 'Unite', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_UNIT' },
        { value: 'COLIS', label: 'Colis', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_COLIS' },
        { value: 'PALLET', label: 'Palette', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_PALLET' }
      ]
    },
    {
      name: 'language',
      label: 'Langue',
      labelTranslatePath: 'DASHBOARD_FIELDS.LANGUAGE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'FR', label: 'Francais', labelTranslatePath: 'DASHBOARD_FIELDS.LANGUAGE_FR' },
        { value: 'EN', label: 'Anglais', labelTranslatePath: 'DASHBOARD_FIELDS.LANGUAGE_EN' },
        { value: 'AR', label: 'Arabe', labelTranslatePath: 'DASHBOARD_FIELDS.LANGUAGE_AR' }
      ]
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'DASHBOARD_FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'DRAFT', label: 'Brouillon', labelTranslatePath: 'OSM_DASHBOARD.ACTIONS.DRAFT' },
        { value: 'VALIDATED', label: 'Validee', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_STATUS_VALIDATED' },
        { value: 'FINALIZED', label: 'Finalisee', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_STATUS_FINALIZED' },
        { value: 'EXPORTED_JSON', label: 'Exportee JSON', labelTranslatePath: 'DASHBOARD_FIELDS.LABEL_STATUS_EXPORTED' }
      ]
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: {
          equalValue: false
        }
      },
      searchs: []
    }
  }
};

import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const BC_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'receipt_long',
  title: 'Gestion des Bons de Commande',
  titleTranslatePath: 'DASHBOARD_TITLES.PURCHASE_ORDERS',
  baseURL: 'inventaire/bons-commande',
  searchEndpoint: 'inventaire/bons-commande',
  addNewItem: true,
  addNewItemUrl: '/stock/bons-commande/nouveau',
  fileName: 'bons-commande',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'VALIDATE', color: 'primary', icon: 'done' },
    { action: 'REFUSE', color: 'warn', icon: 'cancel' }
  ],
  fields: [
    { name: 'numeroBC', label: 'Numero', labelTranslatePath: 'DASHBOARD_FIELDS.NUMBER', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'materielSupplierName', label: 'Material supplier', labelTranslatePath: 'DASHBOARD_FIELDS.MATERIEL_SUPPLIER', attributeType: AttributeType.string, fieldType: FieldType.text, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'status', label: 'Statut', labelTranslatePath: 'CERTIFICATIONS.FIELDS.STATUS', attributeType: AttributeType.enum, fieldType: FieldType.select, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'dateValidation', label: 'Date validation', labelTranslatePath: 'DASHBOARD_FIELDS.VALIDATION_DATE', attributeType: AttributeType.date, fieldType: FieldType.date, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'dateReceptionPrevue', label: 'Reception prevue', labelTranslatePath: 'DASHBOARD_FIELDS.EXPECTED_RECEPTION', attributeType: AttributeType.date, fieldType: FieldType.date, exportable: true, sortable: true, dataTable: true, filterable: true },
    { name: 'createdDate', label: 'Date de creation', labelTranslatePath: 'DASHBOARD_FIELDS.CREATED_DATE', attributeType: AttributeType.date, fieldType: FieldType.date, exportable: true, sortable: true, dataTable: true, filterable: true }
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

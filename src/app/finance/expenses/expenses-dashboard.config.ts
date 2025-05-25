import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import {
  Action,
  AttributeType,
  DashboardConfig,
  FieldType,
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const EXPENSES_DASHBOARD_CONFIG: DashboardConfig = {
  /* ───────────────────────────── méta ───────────────────────────── */
  title: 'Dépenses',
  titleTranslatePath: 'EXPENSES.TITLE',
  baseURL: 'finance/expense',
  searchEndpoint: 'finance/expense',


  /* ─────────────────── bouton "ajouter une dépense" ─────────────── */
  addNewItem: true,
  addNewItemUrl: '/finance/expenses/new',

  /* ─────────────────────────── colonnes du tableau ──────────────── */
  fields: [
    {
      name: 'invoiceRef',
      label: 'Référence facture',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'purchaseNature',
      label: 'Nature de l\'achat',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'object',
      label: 'Objet',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'date',
      label: 'Date',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'amount',
      label: 'Montant',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],

  /* ───────────────────────────── actions ─────────────────────────── */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: <Action[]>[
      { label: 'Consulter', icon: 'visibility', value: 'VIEW' },
      { label: 'Modifier', icon: 'edit', value: 'EDIT' },
      { label: 'Imprimer', icon: 'print', value: 'PRINT' },
      { label: 'Supprimer', icon: 'delete', value: 'DELETE' }
    ]
  },

  /* ──────────────── nom du fichier exporté (optionnel) ───────────── */
  fileName: 'expenses',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: []
    }
  }
};

import {
  Action,
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const EXPENSES_DASHBOARD_CONFIG: DashboardConfig = {
  /* ───────────────────────────── meta ──────────────────────────── */
  title: 'Dépenses',
  titleTranslatePath: 'expenses.title',
  baseURL: 'finance/expense',
  searchEndpoint: 'finance/expense',

  /* ─────────────────────── add-new button ──────────────────────── */
  addNewItem: true,
  addNewItemUrl: 'finance/expense/new',

  /* ─────────────────────────── data grid ───────────────────────── */
  fields: [
    {
      name: 'invoiceRef',
      label: 'Facture',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true,
      exportable: true,
    },
    {
      name: 'purchaseNature',
      label: 'Nature',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true,
      exportable: true,
    },
    {
      name: 'object',
      label: 'Objet',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true,
      exportable: true,
    },
    {
      name: 'date',
      label: 'Date',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      dataTable: true,
      filterable: true,
      exportable: true,

    },
    {
      name: 'amount',
      label: 'Montant',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      filterable: true,
      sortable: false,
      dataTable: true
    }
  ],

  /* ───────────────────────── actions menu ──────────────────────── */
  actions: {
    statusMapping: false,
    actionsList: <Action[]>[
      { label: 'Voir',       icon: 'visibility', value: 'VIEW'      },
      { label: 'Imprimer',   icon: 'print',      value: 'PRINT'     },
      { label: 'Modifier',   icon: 'edit',       value: 'EDIT'      },
      { label: 'Supprimer',  icon: 'delete',     value: 'DELETE'    }
    ]
  },

  /* optional export filename */
  fileName: 'expenses'
};

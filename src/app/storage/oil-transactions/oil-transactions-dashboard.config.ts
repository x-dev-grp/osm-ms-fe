import {AttributeType, DashboardConfig, FieldType} from '../../shared/modules/osm-dashboard/models/dashboard-config';
import {TransactionState, TransactionType} from '../../shared/models/OilTransaction';

export const OIL_TRANSACTIONS_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'swap_horiz',
  title: 'Transactions d\'huile',
  titleTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TITLE',
  baseURL: 'production/oil_transaction',
  searchEndpoint: 'production/oil_transaction',
  addNewItem: true,
  addNewItemUrl: 'storage/oil-transactions/new',

  /* ── Data-table columns & filter metadata ───────────────────── */
  fields: [
    {
      name: 'createdDate',
      label: 'Date de création',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'transactionType',
      label: 'Type de transaction',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.TRANSACTION_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: TransactionType.RECEPTION_IN, label: 'Réception Entrée', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.RECEPTION_IN' },
        { value: TransactionType.EXCHANGE, label: 'Echange', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.EXCHANGE' },
        { value: TransactionType.TRANSFER_IN, label: 'Transfert Interne', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.TRANSFER_IN' },
        { value: TransactionType.LOAN, label: 'Prêt', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.LOAN' },
        { value: TransactionType.SALE, label: 'Vente', labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.TYPES.SALE' }
      ]
    },

    {
      name: 'storageUnitSource.name',
      label: 'Unité source',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.STORAGE_UNIT_SOURCE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },{
      name: 'storageUnitDestination.name',
      label: 'Unité de destination',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.STORAGE_UNIT_DESTINATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'reception.lotNumber',
      label: 'N° Lot',
      labelTranslatePath: 'OIL_TRANSACTION.DELIVERY.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    {
      name: 'quantityKg',
      label: 'Quantité (kg)',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.QUANTITY_KG',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'totalPrice',
      label: 'Prix total',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.TOTAL_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'transactionState',
      label: 'État de la transaction',
      labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.FIELDS.TRANSACTION_STATE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        {
          value: TransactionState.PENDING,
          label: 'En attente',
          labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.PENDING'
        },
        {
          value: TransactionState.COMPLETED,
          label: 'Terminé',
          labelTranslatePath: 'OIL_TRANSACTIONS.DASHBOARD.STATUS.COMPLETED'
        }
      ]
    },

  ],

  /* ── Menu actions (no status mapping) ───────────────────────── */

  fileName: 'OIL_TRANSACTION.LIST'
};

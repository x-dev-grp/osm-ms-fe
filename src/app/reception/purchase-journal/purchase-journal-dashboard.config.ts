import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

/** ABIOOC `abiooc Achat` sheet — all purchase/milling operations in one list. */
export const PURCHASE_JOURNAL_DASHBOARD: DashboardConfig = {
  icon: 'menu_book',
  addNewItem: false,
  title: 'Purchase journal',
  titleTranslatePath: 'ABIOOC.PURCHASE_JOURNAL.TITLE',
  listContext: false,
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
  defaultSearchData: {
    page: 0,
    size: 50,
    sort: 'deliveryDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false },
        operationType: {
          inValues: ['SIMPLE_RECEPTION', 'BASE', 'OLIVE_PURCHASE', 'OIL_PURCHASE', 'EXCHANGE']
        },
        status: {
          inValues: [
            'WAITING',
            'NEW',
            'OLIVE_CONTROLLED',
            'PROD_READY',
            'IN_PROGRESS',
            'COMPLETED',
            'OIL_CONTROLLED',
            'IN_STOCK',
            'STOCK_READY',
            'REFUSED',
            'WAITING_FOR_PAYMENT_DETAILS'
          ]
        }
      }
    }
  },
  fields: [
    {
      name: 'deliveryDate',
      label: 'Date',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      defaultFilter: true,
      filterable: true
    },
    {
      name: 'supplier',
      label: 'Fournisseur',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.name',
      getOptionsUrl: 'production/suppliers_type',
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: true
    },
    {
      name: 'operationType',
      label: "Type d'opération",
      labelTranslatePath: 'BASE_TYPE.OPERATION_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        {
          label: 'Trituration',
          value: 'SIMPLE_RECEPTION',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION'
        },
        { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
        {
          label: 'Achat olive',
          value: 'OLIVE_PURCHASE',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE'
        },
        {
          label: 'Achat huile',
          value: 'OIL_PURCHASE',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE'
        },
        { label: 'Échange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' }
      ]
    },
    {
      name: 'deliveryType',
      label: 'Type',
      labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Olive', value: 'OLIVE', labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OLIVE' },
        { label: 'Huile', value: 'OIL', labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OIL' }
      ]
    },
    {
      name: 'poidsNet',
      label: 'Qté olive (kg)',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.NET_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      calculateTotal: true,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'oilQuantity',
      label: 'Qté huile (L)',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      calculateTotal: true,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire',
      labelTranslatePath: 'WASTE.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'price',
      label: 'Prix / Montant',
      labelTranslatePath: 'OIL_SALES.FIELDS.TOTAL_AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      calculateTotal: true,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'paidAmount',
      label: 'Payée',
      labelTranslatePath: 'DELIVERIES.FIELDS.PAID_AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      calculateTotal: true,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'unpaidAmount',
      label: 'Non payé',
      labelTranslatePath: 'OIL_SALES.FIELDS.UNPAIDAMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      calculateTotal: true,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'rendement',
      label: 'Rendement',
      labelTranslatePath: 'DELIVERIES.FIELDS.RENDEMENT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false
    },
    {
      name: 'paid',
      label: 'Soldé',
      labelTranslatePath: 'DELIVERIES.FIELDS.PAID',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lotNumber',
      label: 'N° lot',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    }
  ],
  fileName: 'journal_achat'
};

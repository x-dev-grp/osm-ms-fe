import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';

export const OLIVE_PURCHASE_DASHBOARD: DashboardConfig = {
  icon: 'list_alt',
  addNewItem: false,
  title: 'Paiements en ddddd',
  titleTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE',
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
  groupedActions: false,
  specificActions: [
    {
      action: 'PAY',
      color: 'primary',
      icon: 'payment',
      disabled: {
        field: 'paid',
        value: true
      }
    },
    {
      action: 'GEN_INVOICE',
      color: 'secondary',
      icon: 'file_copy',
      disabled: {
         value: false
      }
    }
  ],
  filteredActions: [],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [
        {
          operation: SearchOperation.OR,
          searchs: [
            {
              operation: SearchOperation.AND,
              search: {
                isDeleted: {
                  equalValue: false
                },
                operationType: {
                  equalValue: 'OLIVE_PURCHASE'
                },
                status: {
                  inValues: ['PROD_READY', 'COMPLETED']
                }
              }
            },
          ]
        }
      ],
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  },
  fields: [
    {
      name: 'deliveryNumber',
      label: 'N°',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.DELIVERY_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'lotNumber',
      label: 'N° Lot',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'globalLotNumber',
      label: 'N° Lot Global',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.GLOBAL_LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'deliveryType',
      label: 'Type réception',
      labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      valueAttributeType: AttributeType.enum,
      options: [
        { label: 'Huile', value: 'OIL' , labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OIL'},
        {
          label: 'Olive',
          labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OLIVE',
          value: 'OLIVE'
        }
      ],
      valuePath: 'name',
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'deliveryDate',
      label: 'Date ',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'price',
      calculateTotal:true,
      label: 'Montant total',
      labelTranslatePath: 'OIL_SALES.FIELDS.TOTAL_AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unpaidAmount',
      label: 'Montant umpaié',
      calculateTotal:true,
      labelTranslatePath: 'OIL_SALES.FIELDS.UNPAIDAMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'paidAmount',
      calculateTotal:true,
      label: 'Montant partiallment',
      labelTranslatePath: 'OIL_SALES.FIELDS.PARTIALLYPAID',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplier',
      label: 'Fournisseur',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.name',
      getOptionsUrl: 'production/suppliers_type'
    },
    {
      name: 'region',
      label: 'Région',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.REGION',
      attributeType: AttributeType.object,
      exportable: true,
      dataTable: false,
      filterable: true,
      fieldType: FieldType.autocomplete,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'region.name'
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.NET_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    {
      name: 'oilQuantity',
      calculateTotal:true,
      label: 'Qté huile (KG)',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oliveType',
      label: "Type d'olive",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OLIVE_TYPE',
      attributeType: AttributeType.enum,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      fieldType: FieldType.select,
      options: [
        { label: 'OB', value: 'OB', labelTranslatePath: 'OB' },
        { label: 'OC', value: 'OC', labelTranslatePath: 'OC' }
      ]
    },
     {
      name: 'paid',
      label: 'Payé',
      labelTranslatePath: 'Payé',
      attributeType: AttributeType.boolean,
      exportable: true,
      dataTable: true,
      fieldType: FieldType.checkbox,
      filterable: false,
      valuePath: 'paid',
      valueAttributeType: AttributeType.boolean
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false,
      options: [
        { label: 'Nouveau', value: 'NEW', labelTranslatePath: 'RECEPTION_LIST.STATUS.NEW' },
        { label: 'En cours', value: 'IN_PROGRESS', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_PROGRESS' },
        {
          label: 'Contrôle Olives',
          value: 'OLIVE_CONTROLLED',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.OLIVE_CONTROLLED'
        },
        {
          label: 'Contrôle Huile',
          value: 'OIL_CONTROLLED',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.OIL_CONTROLLED'
        },
        { label: 'Terminé', value: 'COMPLETED', labelTranslatePath: 'RECEPTION_LIST.STATUS.COMPLETED' },
        { label: 'Refusé', value: 'REFUSED', labelTranslatePath: 'RECEPTION_LIST.STATUS.REFUSED' },
        { label: 'Annulé', value: 'CANCELLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.CANCELLED' },
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' },
        { label: 'Pre a stocker', value: 'STOCK_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.STOCK_READY' },
        { label: 'Pre pour production', value: 'PROD_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.PROD_READY' }
      ]
    }
  ],

  fileName: 'oil_receptions'
};

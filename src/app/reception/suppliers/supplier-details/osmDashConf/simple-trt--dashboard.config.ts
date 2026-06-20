import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';

export const SIMPLE_RECEPTION_DASHBOARD: DashboardConfig = {
  icon: 'list_alt',
  addNewItem: false,
  title: 'Paiements en ddddd',
  titleTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION',
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
          operation: SearchOperation.AND,
          search: {
            isDeleted: {
              equalValue: false
            },
            operationType: {
              equalValue: 'SIMPLE_RECEPTION'
            },
            status: {
              equalValue: 'COMPLETED'
            }
          }
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
        { label: 'Huile', value: 'OIL', labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OIL' },
        { label: 'Olive', value: 'OLIVE', labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OLIVE' }
      ],
      valuePath: 'name',
      exportable: true,
      sortable: true,
      dataTable: false,
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
      defaultFilter: true,
      filterable: true
    },

    {
      name: 'price',
      calculateTotal: true,
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
      calculateTotal: true,
      label: 'Montant umpaié',
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
      calculateTotal: true,
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
      calculateTotal: true,
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
      label: 'Qté huile (KG)',
      calculateTotal: true,
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
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
        { label: 'Contrôle Olives', value: 'OLIVE_CONTROLLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.OLIVE_CONTROLLED' },
        { label: 'Contrôle Huile', value: 'OIL_CONTROLLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.OIL_CONTROLLED' },
        { label: 'Terminé', value: 'COMPLETED', labelTranslatePath: 'RECEPTION_LIST.STATUS.COMPLETED' },
        { label: 'Refusé', value: 'REFUSED', labelTranslatePath: 'RECEPTION_LIST.STATUS.REFUSED' },
        { label: 'Annulé', value: 'CANCELLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.CANCELLED' },
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' },
        { label: 'Pre a stocker', value: 'STOCK_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.STOCK_READY' },
        { label: 'Pre pour production', value: 'PROD_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.PROD_READY' }
      ]
    },

    // ====== NEW fields appended from UnifiedDelivery ======
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'OIL_SALES.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: false
    },
    {
      name: 'poidsBrute',
      calculateTotal: true,
      label: 'Poids brut (kg)',
      labelTranslatePath: 'DELIVERIES.FIELDS.GROSS_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: false
    },

    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.TRUCK_PLATE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: true
    },
    {
      name: 'etatCamion',
      label: 'État camion',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.TRUCK_STATE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: true
    },
    {
      name: 'oilVariety',
      label: "Variété d'huile",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OIL_VARIETY',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: false,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'oilVariety.name'
    },
    {
      name: 'oilType',
      label: "Type d'huile",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OIL_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: true,
      // Values depend on Olive_Oil_Type; keep as free-form select for now
      options: [
        { label: 'OB', value: 'OB', labelTranslatePath: 'OB' },
        {
          label: 'OC',
          value: 'OC',
          labelTranslatePath: 'OC'
        }
      ]
    },
    {
      name: 'trtDate',
      label: 'Date traitement',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.TRT_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false,
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
      dataTable: false,
      filterable: true,
      options: [
        { label: 'Réception simple', value: 'SIMPLE_RECEPTION', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION' },
        { label: 'Achat olives', value: 'OLIVE_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE' },
        { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
        { label: 'Échange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
        { label: 'Achat huile', value: 'OIL_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' }
      ]
    },
    {
      name: 'oliveVariety',
      label: "Variété d'olive",
      labelTranslatePath: 'OLIVE_RECEPTION.FORM.FIELDS.OLIVE_VARIETY',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'oliveVariety.name'
    },
    {
      name: 'sackCount',
      label: 'Nb. sacs',
      labelTranslatePath: 'CONTROLE_QUALITE.OLIVE_DETAILS.SACK_COUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'rendement',
      label: 'Rendement (%)',
      labelTranslatePath: 'DELIVERIES.FIELDS.RENDEMENT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oliveQuantity',
      calculateTotal: true,
      label: 'Qté olives (KG)',
      labelTranslatePath: 'OLIVE_RECEPTION.FORM.FIELDS.OLIVE_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'parcel',
      label: 'Parcelle',
      labelTranslatePath: 'BASE_TYPE.PARCEL',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: false,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'parcel.name'
    },
    {
      name: 'storageUnit',
      label: 'Unité de stockage',
      labelTranslatePath: 'CONTROLE_QUALITE.STORAGE_UNIT.LABEL',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: false,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'storageUnit.name'
    },
    {
      name: 'categoryOliveOil',
      label: "Catégorie d'huile/olive",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.CATEGORY_OLIVE_OIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: true
    },
    {
      name: 'lotOliveNumber',
      label: 'N° Lot Olive',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.LOT_OLIVE_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    }
  ],

  fileName: 'oil_receptions'
};

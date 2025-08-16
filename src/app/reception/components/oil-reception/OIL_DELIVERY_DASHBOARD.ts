import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
  icon: 'water_drop',
  title: "Livraisons d'Huile",
  titleTranslatePath: 'OIL_RECEPTION.DASHBOARD.TITLE',
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
  addNewItem: true,
  addNewItemUrl: 'reception/reception-huile/new',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted:{
          equalValue:false
        },
        status: {
          inValues: [
            'NEW',
            'IN_PROGRESS',
            'OIL_CONTROLLED',
            'WAITING_FOR_PRICING',
            'REFUSED',
            'STOCK_READY',
            'CANCELLED',
            'WAITING_FOR_PAYMENT_DETAILS'
          ]
        },
        deliveryType: {
          equalValue: deliveryType.OIL
        }
      },
      searchs: []
    }
  } /* ────────────────────────────────────────────────────────────── */ /*         Champs pour les livraisons d'huile                    */,
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants */
    {
      name: 'deliveryNumber',
      label: 'N° Livraison',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.DELIVERY_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: true
    },
    {
      name: 'lotNumber',
      label: 'N° Lot',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.LOT_NUMBER',
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
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.GLOBAL_LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    } /* Dates */,
    {
      name: 'deliveryDate',
      label: 'Date de livraison',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    } /* Fournisseur & Localisation */,
    {
      name: 'supplier',
      label: 'Fournisseur',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'supplierInfo.name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.supplierInfo.name',
      getOptionsUrl:'production/suppliers_type'
    },
    {
      name: 'region',
      label: 'Région',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.REGION',
      attributeType: AttributeType.object,
      exportable: true,
      dataTable: true,
      filterable: true,
      fieldType: FieldType.autocomplete,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'region.name',

    },
    {
      name: 'operationType',
      label: 'Type d\'operation',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OPERATION_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Trituration particulier', value: 'SIMPLE_RECEPTION', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION' },
        { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
        { label: 'Achat Olive', value: 'OLIVE_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE' },
        { label: 'Achat Huile', value: 'OIL_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' },
        { label: 'Echange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
        { label: 'reception intern', value: 'INTERNAL_RECEPTION', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.INTERNAL_RECEPTION' },
        { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' }
      ]
    },
    {
      name: 'lotOliveNumber',
      label: 'N° Lot olive',
      labelTranslatePath: 'DELIVERIES.FIELDS.OLIVE_LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'poidsBrute',
      label: 'Poids brut (kg)',
      labelTranslatePath: 'DELIVERIES.FIELDS.GROSS_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    /* Quantités & Prix */
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      labelTranslatePath: 'DELIVERIES.FIELDS.NET_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oilQuantity',
      label: 'Qté huile (KG)',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    /* Type d'huile */
    {
      name: 'oilType',
      label: "Type d'huile",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OIL_TYPE',
      attributeType: AttributeType.object,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      fieldType: FieldType.autocomplete,
    },
    {
      name: 'oilVariety',
      label: "Variété d'huile",
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_VARIETY',
      attributeType: AttributeType.object,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      fieldType: FieldType.autocomplete,
    },

    /* Statut */
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        {
          label: 'Nouveau',
          value: 'NEW',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.NEW'
        },
        {
          label: 'En cours',
          value: 'IN_PROGRESS',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_PROGRESS'
        },
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
        {
          label: 'Terminé',
          value: 'COMPLETED',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.COMPLETED'
        },
        { label: 'Refusé', value: 'REFUSED', labelTranslatePath: 'RECEPTION_LIST.STATUS.REFUSED' },
        { label: 'Prét à stocker', value: 'STOCK_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.REFUSED' },

        {
          label: 'Annulé',
          value: 'CANCELLED',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.CANCELLED'
        },
        {
          label: 'à definire le prix ',
          value: 'WAITING_FOR_PRICING',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.WAITING_FOR_PRICING'
        },
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' }
      ]
    }
  ],

  fileName: 'oil_deliveries'
};

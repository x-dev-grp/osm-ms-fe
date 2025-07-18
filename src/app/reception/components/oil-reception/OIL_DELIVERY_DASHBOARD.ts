import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
  icon: 'water_drop',
  title: "Livraisons d'Huile",
  titleTranslatePath: 'OIL_RECEPTION.DASHBOARD.TITLE',
  baseURL: 'deliveries',
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
      label: 'N° Bon de réception',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.DELIVERY_NUMBER',
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
      name: 'supplier.supplierInfo',
      label: 'Fournisseur',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'region',
      label: 'Région',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.REGION',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    } /* Quantités & Prix */,
    {
      name: 'oilQuantity',
      label: 'Qté huile (L)',
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
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_TYPE',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'oilVariety',
      label: "Variété d'huile",
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.OIL_VARIETY',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
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

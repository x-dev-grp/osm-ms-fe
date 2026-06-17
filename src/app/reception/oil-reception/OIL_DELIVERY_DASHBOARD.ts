import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../shared/models/deleveryType';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../shared/models/type-category.enum';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
  icon: 'water_drop',
  title: "Réceptions d'Huile",
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
        isDeleted: {
          equalValue: false
        },
        status: {
          inValues: [
            'NEW',
            'IN_PROGRESS',
            'OIL_CONTROLLED',
            'WAITING_FOR_PRICING',
            'WAITING',
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
  } /* ────────────────────────────────────────────────────────────── */ /*         Champs pour les réceptions d'huile                    */ /* ────────────────────────────────────────────────────────────── */,
  fields: [
    /* Identifiants */
    {
      name: 'deliveryNumber',
      label: 'N° réception',
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
      name: 'deliveryDate',
      label: 'Date ',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.DELIVERY_DATE',
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
      dataTable: true,
      filterable: true,
      fieldType: FieldType.autocomplete,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      getOptionsUrl: 'production/types',
      filterAttribute: 'region.name',
      autoCompleteDefaultCriteria: {
        page: 0,
        size: 10,
        sort: 'createdDate',
        order: 'DESC',
        searchData: {
          operation: SearchOperation.AND,
          searchs: [],
          search: {
            isDeleted: {
              equalValue: false
            },
            type: {
              equalValue: TypeCategory.REGION
            }
          }
        }
      },
      autoCompleteFilterAttributes: ['name']
    },

    {
      name: 'operationType',
      label: "Type d'operation",
      labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      dataTable: true,
      filterable: true,
      options: [
        {
          label: 'Trituration particulier',
          value: 'SIMPLE_RECEPTION',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.SIMPLE_RECEPTION'
        },
        { label: 'Base', value: 'BASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.BASE' },
        {
          label: 'Achat Olive',
          value: 'OLIVE_PURCHASE',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OLIVE_PURCHASE'
        },
        {
          label: 'Achat Huile',
          value: 'OIL_PURCHASE',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE'
        },
        {
          label: 'Echange',
          value: 'EXCHANGE',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE'
        },
        {
          label: 'reception intern',
          value: 'INTERNAL_RECEPTION',
          labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.INTERNAL_RECEPTION'
        },
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
      name: 'oilQuantity',
      label: 'Poids net (kg)',
      labelTranslatePath: 'PDF.OIL_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    {
      name: 'oilType',
      label: "Type d'huile",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OIL_TYPE',
      attributeType: AttributeType.enum,
      exportable: true,
      dataTable: true,
      filterable: true,
      fieldType: FieldType.select,
      options: [
        {
          label: 'OC',
          labelTranslatePath: 'HC',
          value: 'OC'
        },
        {
          label: 'OB',
          labelTranslatePath: 'HB',
          value: 'OB'
        }
      ]
    },

    /* Statut */
    {
      name: 'status',
      label: 'status',
      labelTranslatePath: 'DELIVERIES.FIELDS.STATUS',
      attributeType: AttributeType.enum,
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
          label: 'En attente',
          value: 'WAITING',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.WAITING'
        },
        {
          label: 'prét pour production',
          value: 'PROD_READY',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.PROD_READY'
        },
        {
          labelTranslatePath: 'RECEPTION_LIST.STATUS.STOCK_READY',
          label: 'prét pour stocker',
          value: 'STOCK_READY'
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
        {
          label: 'Annulé',
          value: 'CANCELLED',
          labelTranslatePath: 'RECEPTION_LIST.STATUS.CANCELLED'
        },
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' }
      ]
    }
  ],

  fileName: 'oil_deliveries'
};

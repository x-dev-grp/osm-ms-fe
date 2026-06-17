import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../shared/models/deleveryType';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../shared/models/type-category.enum';

export const OilQCDASHBOARD: DashboardConfig = {
  icon: 'fact_check',
  title: 'Contrôle Qualité',
  titleTranslatePath: 'OSM_DASHBOARD.ACTIONS.OIL_QUALITY',
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
  groupedActions: false,
  specificActions: [],
  addNewItem: false,
  filteredActions: ['UPDATE', 'DELETE', 'CANCEL'],
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
        deliveryType: {
          equalValue: deliveryType.OIL
        }
      }
    }
  },
  fields: [
    {
      name: 'lotNumber',
      label: 'N° Lot',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      labelTranslatePath: 'DELIVERIES.FORM.FIELDS.LOT_NUMBER'
    },
    {
      name: 'operationType',
      label: 'Type de trituration',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OPERATION_TYPE',
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
        { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' }
      ]
    },
    {
      name: 'deliveryType',
      label: 'Type de réception',
      labelTranslatePath: 'DELIVERIES.FIELDS.DELIVERY_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        {
          label: 'Olive',
          value: deliveryType.OLIVE,
          labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OLIVE'
        },
        { label: 'Huile', value: deliveryType.OIL, labelTranslatePath: 'SUPPLIER_PAYMENT.RECEPTION_TYPE_OIL' }
      ]
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
      name: 'oilQuantity',
      label: 'Poids net (kg)',
      attributeType: AttributeType.number,
      labelTranslatePath: 'PDF.OIL_QUANTITY',

      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oilType',
      label: "Type d'olive",
      labelTranslatePath: 'OIL_SALES.OIL_TYPE',
      attributeType: AttributeType.enum,
      exportable: true,
      dataTable: true,
      filterable: true,
      fieldType: FieldType.select,
      sortable: true,
      options: [
        {
          label: 'OC',
          value: 'OC',
          labelTranslatePath: 'OC'
        },
        {
          label: 'OB',
          value: 'OB',
          labelTranslatePath: 'OB'
        }
      ],
      valueAttributeType: AttributeType.string
    },

    {
      name: 'oilVariety',
      label: "Variété d'olive",
      labelTranslatePath: 'DELIVERIES.FIELDS.OLIVE_VARIETY',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      getOptionsUrl: 'production/types',
      filterAttribute: 'oliveVariety.name',
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
              equalValue: TypeCategory.OLIVE_VARIETY
            }
          }
        }
      },
      autoCompleteFilterAttributes: ['name']
    },

    {
      name: 'status',
      label: 'Statut',
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
    },
    {
      name: 'qualityControlResults',
      flattedListName: 'qualityControlResults',
      label: 'qualityControlResults ',
      labelTranslatePath: 'AUTO.QUALITYCONTROLRESULTS',
      exportLabel: 'Quality results',
      attributeType: AttributeType.object,
      fieldType: FieldType.list,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: false,
      flattedList: true,
      valueField: 'measuredValue',
      columnPrefix: '',
      nameField: 'rule.ruleName'
    }
  ],
  // "collectionFields": [
  //   {
  //     "collectionPath": "qualityControls",
  //     "nameField": "rule.ruleName",
  //     "valueField": "value",
  //     "columnPrefix": "QC_"
  //   }
  // ]
  fileName: 'quality_control_list_huile'
};

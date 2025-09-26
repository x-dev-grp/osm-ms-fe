import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../shared/models/deleveryType';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../shared/models/type-category.enum';

export const QUALITY_CONTROL_DASHBOARD: DashboardConfig = {
  icon: 'fact_check',
  title: 'Contrôle Qualité',
  titleTranslatePath: 'OSM_DASHBOARD.QUALITY_CONTROL.TITLE',
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
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
        }
      }
    }
  },
  fields: [
    {
      name: 'deliveryNumber',
      label: 'N° réception',
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
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
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
        { label: 'Achat Huile', value: 'OIL_PURCHASE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.OIL_PURCHASE' },
        { label: 'Echange', value: 'EXCHANGE', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.EXCHANGE' },
        { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' }
      ]
    },
    {
      name: 'deliveryType',
      label: 'Type de réception',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Olive', value: deliveryType.OLIVE },
        { label: 'Huile', value: deliveryType.OIL }
      ]
    },
    {
      name: 'deliveryDate',
      label: 'Date ',
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
      getOptionsUrl:'production/suppliers_type'
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
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
      fieldType: FieldType.select,
      sortable: true,
      options: [
        {
          label: 'OC',
          value: 'OC'
        },
        {
          label: 'OB',
          value: 'OB'
        }
      ],
      valueAttributeType: AttributeType.string
    },

    {
      name: 'oliveVariety',
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
        { label: 'Nouveau', value: 'NEW', labelTranslatePath: 'RECEPTION_LIST.STATUS.NEW' },
        { label: 'En attente', value: 'WAITING', labelTranslatePath: 'RECEPTION_LIST.STATUS.WAITING' },
        { label: 'prét pour production', value: 'PROD_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.PROD_READY' },
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
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' }
      ]
    }
  ],

  fileName: 'quality_control_list'
};

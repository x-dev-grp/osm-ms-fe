import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../shared/models/type-category.enum';

export const LIST_RECEPTION_DASHBOARD: DashboardConfig = {
  icon: 'list_alt',
  addNewItem: false,
  title: "Réceptions d'Huile et Triturations",
  titleTranslatePath: 'DELIVERIES.OIL_TITLE',
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries',
  defaultSearchData: {
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
        status: {
          inValues: ['COMPLETED', 'REFUSED', 'CANCELLED', 'IN_STOCK']
        }
      }
    }
  },
  fields: [
    {
      name: 'deliveryNumber',
      label: 'N° réception',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.DELIVERY_NUMBER',
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
      name: 'poidsNet',
      label: 'Poids net (kg)',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.NET_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      calculateTotal:true
    },
    {
      name: 'oilType',
      label: "Type d'huile",
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.OIL_TYPE',
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
      name: 'operationType',
      label: 'Type de trituration',
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
        { label: 'Paiement', value: 'PAYMENT', labelTranslatePath: 'DELIVERIES.OPERATION_TYPE.PAYMENT' }
      ]
    },
    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.TRUCK_PLATE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'RECEPTION_LIST.FIELDS.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Nouveau', value: 'NEW', labelTranslatePath: 'RECEPTION_LIST.STATUS.NEW' },
        { label: 'En cours', value: 'IN_PROGRESS', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_PROGRESS' },
        { label: 'Contrôle Olives', value: 'OLIVE_CONTROLLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.OLIVE_CONTROLLED' },
        { label: 'Contrôle Huile', value: 'OIL_CONTROLLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.OIL_CONTROLLED' },
        { label: 'Terminé', value: 'COMPLETED', labelTranslatePath: 'RECEPTION_LIST.STATUS.COMPLETED' },
        { label: 'Refusé', value: 'REFUSED', labelTranslatePath: 'RECEPTION_LIST.STATUS.REFUSED' },
        { label: 'Annulé', value: 'CANCELLED', labelTranslatePath: 'RECEPTION_LIST.STATUS.CANCELLED' },
        { label: 'En stock', value: 'IN_STOCK', labelTranslatePath: 'RECEPTION_LIST.STATUS.IN_STOCK' }
      ]
    }
  ],

  fileName: 'oil_receptions'
};

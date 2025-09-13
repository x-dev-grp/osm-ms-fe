import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../../shared/models/type-category.enum';

export const OLIVE_DELIVERY_DASHBOARD: DashboardConfig = {
  icon: 'eco',
  title: "Livraisons d'Olives", // afficehr titre fi dashboard
  titleTranslatePath: 'DELIVERIES.OLIVE_TITLE', //tradusction
  baseURL: 'production/deliveries',
  searchEndpoint: 'production/deliveries', //endpoint fl backedn
  addNewItem: true, //show new button
  addNewItemUrl: 'reception/reception-olive/new', //add new componnt path
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search:{
        isDeleted:{
          equalValue:false
        },
        status: {
          inValues: ['NEW', 'IN_PROGRESS', 'OLIVE_CONTROLLED','WAITING_FOR_PRICING','PROD_READY', 'REFUSED', 'CANCELLED']
        },
        deliveryType: {
          equalValue: deliveryType.OLIVE
        }
      },
      searchs:[]
    }
  }, // if youy need ot load the dta initilly based on this
  /* ────────────────────────────────────────────────────────────── */
  /*         Champs pour les livraisons d'olives                   */
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants */
    {
      name: 'deliveryNumber',
      label: 'N° Livraison',
      labelTranslatePath: 'DELIVERIES.FIELDS.DELIVERY_NUMBER',
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
      labelTranslatePath: 'DELIVERIES.FIELDS.LOT_NUMBER',
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
      labelTranslatePath: 'DELIVERIES.FIELDS.GLOBAL_LOT_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    /* Dates */
    {
      name: 'deliveryDate',
      label: 'Date de livraison',
      labelTranslatePath: 'DELIVERIES.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    /* Fournisseur & Localisation */
    {
      name: 'supplier',
      label: 'Fournisseur',
      labelTranslatePath: 'DELIVERIES.FIELDS.SUPPLIER',
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
      getOptionsUrl:"production/types",
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
    /* Poids */
    {
      name: 'poidsBrute',
      label: 'Poids brut (kg)',
      labelTranslatePath: 'DELIVERIES.FIELDS.GROSS_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      labelTranslatePath: 'DELIVERIES.FIELDS.NET_WEIGHT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    /* Type d'olive */
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
          value: 'OC',
        },
        {
          label: 'OB',
          value: 'OB',
        }
      ],
      valueAttributeType:AttributeType.string,
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
      getOptionsUrl:"production/types",
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
    /* type operation */
    {
      name: 'operationType',
      label: 'Type de trituration',
      labelTranslatePath: 'DELIVERIES.FIELDS.OPERATION_TYPE',
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
    /* Statut */
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
        { label: 'prét pour production', value: 'PROD_READY', labelTranslatePath: 'RECEPTION_LIST.STATUS.PROD_READY' },
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


  /* Nom par défaut du fichier d'export CSV */
  fileName: 'olive_deliveries'
};

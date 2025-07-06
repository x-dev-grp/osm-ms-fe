import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OLIVE_DELIVERY_DASHBOARD: DashboardConfig = {
  title: "Livraisons d'Olives", // afficehr titre fi dashboard
  titleTranslatePath: 'DELIVERIES.OLIVE_TITLE', //tradusction
  baseURL: 'production/deliveries', //todo remove it usless
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
      searchs: [
        {
          search: {
            status: {
              inValues: ['NEW', 'IN_PROGRESS', 'OLIVE_CONTROLLED', 'REFUSED', 'CANCELLED']
            },
            deliveryType: {
              equalValue: deliveryType.OLIVE
            }
          }
        }
      ]
    }
  }, // if youy need ot load the dta initilly based on this
  /* ────────────────────────────────────────────────────────────── */
  /*         Champs pour les livraisons d'olives                   */
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants */
    {
      name: 'deliveryNumber',
      label: 'N° Bon de réception',
      labelTranslatePath: 'DELIVERIES.FIELDS.DELIVERY_NUMBER',
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
      name: 'supplier.supplierInfo',
      label: 'Fournisseur',
      labelTranslatePath: 'DELIVERIES.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.supplierInfo.name'
    },
    {
      name: 'region',
      label: 'Région',
      labelTranslatePath: 'DELIVERIES.FIELDS.REGION',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'region.name'
    },
    /* Poids */
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
    /* Type d'olive */
    {
      name: 'oliveType',
      label: "Type d'olive",
      labelTranslatePath: 'DELIVERIES.FIELDS.OLIVE_TYPE',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'oliveType.name'
    },
    {
      name: 'oliveVariety',
      label: "Variété d'olive",
      labelTranslatePath: 'DELIVERIES.FIELDS.OLIVE_VARIETY',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'oliveVariety.name'
    },
    /* Camion */
    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      labelTranslatePath: 'DELIVERIES.FIELDS.TRUCK_PLATE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true
    },
    /* Statut */
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'DELIVERIES.FIELDS.STATUS',
      attributeType: AttributeType.string,
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

  /* Actions pour les livraisons d'olives */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'READ' },
      { label: 'Modifier', icon: 'edit', value: 'UPDATE' },
      { label: 'Supprimer', icon: 'delete', value: 'DELETE' },
      { label: 'Contrôle Qualité', icon: 'fact_check', value: 'QUALITY' },
      { label: 'Générer bon de réception', icon: 'picture_as_pdf', value: 'GENPDF' }
    ]
  },

  /* Nom par défaut du fichier d'export CSV */
  fileName: 'olive_deliveries'
};

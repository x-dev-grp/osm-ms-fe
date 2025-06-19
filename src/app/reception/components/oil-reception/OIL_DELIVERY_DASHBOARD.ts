import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
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
      searchs: [
        {
          search: {
            deliveryType: {
              equalValue: deliveryType.OIL
            },
            hasQualityControl: {
              equalValue: false
            }
          }
        }
      ]
    }
  },
  /* ────────────────────────────────────────────────────────────── */
  /*         Champs pour les livraisons d'huile                    */
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
    },
    /* Dates */
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
    },
    /* Fournisseur & Localisation */
    {
      name: 'supplier.supplierInfo',
      label: 'Fournisseur',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
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
    },
    /* Quantités & Prix */
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
    {
      name: 'unitPrice',
      label: 'Prix unitaire (€/L)',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'price',
      label: 'Prix total (€)',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.TOTAL_PRICE',
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
    /* Camion */
    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.TRUCK_PLATE',
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
      labelTranslatePath: 'OIL_RECEPTION.DASHBOARD.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Nouveau', value: 'NEW', labelTranslatePath: 'DELIVERIES.STATUS.NEW' },
        { label: 'En cours', value: 'IN_PROGRESS', labelTranslatePath: 'DELIVERIES.STATUS.IN_PROGRESS' },
        { label: 'Terminé', value: 'COMPLETED', labelTranslatePath: 'DELIVERIES.STATUS.COMPLETED' },
        { label: 'Refusé', value: 'REFUSED', labelTranslatePath: 'DELIVERIES.STATUS.REFUSED' },
        { label: 'Annulé', value: 'CANCELLED', labelTranslatePath: 'DELIVERIES.STATUS.CANCELLED' }
      ]
    }
  ],

  /* Actions pour les livraisons d'huile */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'CONSULTER' },
      { label: 'Modifier', icon: 'edit', value: 'MODIFIER' },
      { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' },
      { label: 'Contrôle Qualité', icon: 'fact_check', value: 'QUALITY' },
      { label: 'Génerer Bon Réception', icon: 'fact_check', value: 'generer_pdf' }
    ]
  },

  /* Nom par défaut du fichier d'export CSV */
  fileName: 'oil_deliveries'
};

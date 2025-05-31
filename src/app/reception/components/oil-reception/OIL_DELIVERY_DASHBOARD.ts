import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
  title: "Livraisons d'Huile",
  titleTranslatePath: 'DELIVERIES.OIL_TITLE',
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
      searchs: [],
      search: {
        deliveryType: {
          equalValue: deliveryType.OIL
        }
      }
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
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Nouveau', value: 'NEW' },
        { label: 'En cours', value: 'IN_PROGRESS' },
        { label: 'Terminé', value: 'COMPLETED' },
        { label: 'Refusé', value: 'REFUSED' },
        { label: 'Annulé', value: 'CANCELLED' }
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

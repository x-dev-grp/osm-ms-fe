import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const OLIVE_DELIVERY_DASHBOARD: DashboardConfig = {
  title: "Livraisons d'Olives", // afficehr titre fi dashboard
  titleTranslatePath: 'DELIVERIES.OLIVE_TITLE', //tradusction
  baseURL: 'deliveries', //todo remove it usless
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
      searchs: [],
      search: {
        deliveryType: {
          equalValue: deliveryType.OLIVE
        }
      }
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
      sortable: true,
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
    /* Poids */
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
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
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'oliveVariety',
      label: "Variété d'olive",
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

  /* Actions pour les livraisons d'olives */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'CONSULTER' },
      { label: 'Modifier', icon: 'edit', value: 'MODIFIER' },
      { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' },
      { label: 'Contrôle Qualité', icon: 'fact_check', value: 'QUALITY' },
      { label: 'Générer bon de réception', icon: 'picture_as_pdf', value: 'generate_pdf' }
    ]
  },

  /* Nom par défaut du fichier d'export CSV */
  fileName: 'olive_deliveries'
};

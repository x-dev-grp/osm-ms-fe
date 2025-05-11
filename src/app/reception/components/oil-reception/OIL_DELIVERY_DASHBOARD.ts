import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../../shared/models/type-category.enum';

export const OIL_DELIVERY_DASHBOARD: DashboardConfig = {
  title: 'Livraisons d\'Huile',
  titleTranslatePath: 'DELIVERIES.OIL_TITLE',
  baseURL: 'deliveries',
  searchEndpoint: 'production/deliveries',
  addNewItem: true,
  addNewItemUrl: 'reception/reception-huile/new',

  /* ────────────────────────────────────────────────────────────── */
  /*         Champs pour les livraisons d'huile                    */
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants & méta */
    {
      name: 'deliveryNumber',
      label: 'N° Livraison',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
    {
      name: 'deliveryType',
      label: 'Type de livraison',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: false,
      options: [
        { label: 'Huile', value: deliveryType.OIL }
      ],
       defaultFilter:  true
    },
    {
      name: 'lotNumber',
      label: 'N° Lot',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },
    {
      name: 'globalLotNumber',
      label: 'N° Lot Global',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true
    },

    /* Dates */
    {
      name: 'deliveryDate',
      label: 'Date de livraison',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true
    },

    /* Localisation */
    {
      name: 'region.name',
      label: 'Région',
      attributeType: AttributeType.string,
      fieldType: FieldType.autocomplete,
      exportable: true,
      valuePath: 'name',
      getOptionsUrl: 'production/types',
      autoCompleteDefaultCriteria: {
        page: 0,
        size: 10,
        sort: 'createdDate',
        order: 'DESC',
        searchData: {
          operation: SearchOperation.AND,
          searchs: [],
          search: {
            type: {
              equalValue: 'REGION'
            }
          }
        }
      },
      autoCompleteFilterAttributes: ['name'],
      filterable: true,
      dataTable: true
    },

    /* Poids & quantités */
    {
      name: 'poidsBrute',
      label: 'Poids brut (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: false,
      sortable: false,
      dataTable: false
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.slider,
      exportable: false,
      filterAttribute: FieldType.slider,
      sortable: false,
      dataTable: false
    },
    {
      name: 'oilQuantity',
      label: 'Qté huile (L)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      dataTable: true
    },

    /* Prix */
    {
      name: 'unitPrice',
      label: 'Prix unitaire (€/L)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      dataTable: true
    },
    {
      name: 'price',
      label: 'Prix total (€)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      dataTable: true
    },
    {
      name: 'paidAmount',
      label: 'Montant payé (€)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true
    },
    {
      name: 'unpaidAmount',
      label: 'Montant impayé (€)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true
    },

    /* Camion & état */
    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true
    },
    {
      name: 'etatCamion',
      label: 'État camion',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true
    },

    /* Fournisseur */
    {
      name: 'supplier.supplierInfo.name',
      label: 'Fournisseur',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      getOptionsUrl: 'production/suppliers_type',
      autoCompleteFilterAttributes: ['supplierInfo.name'],
      valuePath: 'name',
      exportable: true,
      dataTable: true
    },

    /* Oil-specific fields */
    {
      name: 'oilVariety',
      label: "Variété d'huile",
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      getOptionsUrl: 'production/types',
      valuePath: 'name',
      autoCompleteDefaultCriteria: {
        page: 0,
        size: 10,
        sort: 'createdDate',
        order: 'DESC',
        searchData: {
          operation: SearchOperation.AND,
          searchs: [],
          search: {
            type: {
              equalValue: TypeCategory.OIL_VARIETY
            }
          }
        }
      },
      filterable: true,
      autoCompleteFilterAttributes: ['name'],
      exportable: true,
      dataTable: true
    },
    {
      name: 'oilType',
      label: "Type d'huile",
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true
    }
  ],

  /* Actions pour les livraisons d'huile */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'CONSULTER' },
      { label: 'Modifier', icon: 'edit', value: 'MODIFIER' },
      { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' }
    ]
  },

  /* Nom par défaut du fichier d’export CSV */
  fileName: 'oil_deliveries'
};

import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../../shared/models/type-category.enum';

export const UNIFIED_DELIVERY_DASHBOARD: DashboardConfig = {
  icon: 'local_shipping',
  title: 'Livraisons',
  titleTranslatePath: 'DELIVERIES.TITLE',
  baseURL: 'deliveries',
  searchEndpoint: 'production/deliveries',
  addNewItem: true,
  addNewItemUrl: 'production/deliveries/new',

  /* ────────────────────────────────────────────────────────────── */
  /*         Champs (un Field par attribut de UnifiedDelivery)      */
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants & méta */
    {
      name: 'deliveryNumber',
      label: 'N° Bon de réception',
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
      dataTable: true,
      options: [
        { label: 'Olive', value: deliveryType.OLIVE },
        { label: 'Huile', value: deliveryType.OIL }
      ]
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
    {
      name: 'trtDate',
      label: 'Date de traitement',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      dataTable: true
    },

    /* Localisation & parcelle */
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
      filterable: true
    },
    {
      name: 'parcel',
      label: 'Parcelle',
      attributeType: AttributeType.string,
      fieldType: FieldType.text
    },
    {
      name: 'poidsBrute',
      label: 'Poids brut (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: false,
      dataTable: true
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.slider,
      exportable: true,
      filterAttribute: FieldType.slider,
      sortable: true,
      dataTable: true
    },
    {
      name: 'oliveQuantity',
      label: 'Qté olives (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number
    },
    {
      name: 'oilQuantity',
      label: 'Qté huile (L)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number
    },

    /* Rendement & sacs */
    {
      name: 'rendement',
      label: 'Rendement (%)',
      attributeType: AttributeType.number,
      fieldType: FieldType.slider,
      sliderMinValue: 0,
      sliderMaxValue: 100
    },

    {
      name: 'sackCount',
      label: 'Nb sacs',
      attributeType: AttributeType.number,
      fieldType: FieldType.number
    },

    /* Camion & état */
    {
      name: 'matriculeCamion',
      label: 'Matricule camion',
      attributeType: AttributeType.string,
      fieldType: FieldType.text
    },
    {
      name: 'etatCamion',
      label: 'État camion',
      attributeType: AttributeType.string,
      fieldType: FieldType.text
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
      dataTable: true
    },
    {
      name: 'oliveVariety.name',
      label: "Variété d'olive",
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
              equalValue: TypeCategory.OLIVE_VARIETY
            }
          }
        }
      },
      filterable: true,
      autoCompleteFilterAttributes: ['oliveVariety.name']
    },
    {
      name: 'oliveType.name',
      label: "Type d'olive",
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
              equalValue: TypeCategory.OLIVE_TYPE
            }
          }
        }
      },
      filterable: true,
      autoCompleteFilterAttributes: ['oliveType.name']
    },
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
      autoCompleteFilterAttributes: ['name']
    }
  ],

  /* Actions génériques (exemple) */


  /* Nom par défaut du fichier d’export CSV */
  fileName: 'deliveries'
};

import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../../../shared/models/type-category.enum';

export const OLIVE_DELIVERY_DASHBOARD: DashboardConfig = {
  title: 'Livraisons d\'Olives',// afficehr titre fi dashboard
  titleTranslatePath: 'DELIVERIES.OLIVE_TITLE', //tradusction
  baseURL: 'deliveries', //todo remove it usless
  searchEndpoint: 'production/deliveries',//endpoint fl backedn
  addNewItem: true,//show new button
  addNewItemUrl: 'reception/reception-olive/new',//add new componnt path
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
  },// if youy need ot load the dta initilly based on this
  /* ────────────────────────────────────────────────────────────── */
  /*         Champs pour les livraisons d'olives                   */
  /* ────────────────────────────────────────────────────────────── */
  fields: [
    /* Identifiants & méta */
    {
      name: 'deliveryNumber',
      label: 'N° Livraison',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,// how to displaye it in front end
      exportable: true,// export to csv or pdf
      sortable: true,
      dataTable: true // display in datatabele
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
        { label: 'Olive', value: deliveryType.OLIVE }
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
      label: 'Date de trituration',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      dataTable: true,

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
      filterable: true,
      dataTable: true
    }, {
      name: 'operationType.name',
      label: 'Type operation',
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
              equalValue: 'OPERATION_TYPE'
            }
          }
        }
      },
      autoCompleteFilterAttributes: ['name'],
      filterable: true,
      dataTable: true
    },
    {
      name: 'parcel',
      label: 'Parcelle',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      filterable: true,
      dataTable: true
    },

    /* Poids & quantités */
    {
      name: 'poidsBrute',
      label: 'Poids brut (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
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
      fieldType: FieldType.number,
      exportable: true,
      dataTable: true
    },

    /* Rendement & sacs */
    {
      name: 'rendement',
      label: 'Rendement (%)',
      attributeType: AttributeType.number,
      fieldType: FieldType.slider,
      sliderMinValue: 0,
      sliderMaxValue: 100,
      exportable: true,
      dataTable: true
    },
    {
      name: 'sackCount',
      label: 'Nb sacs',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      dataTable: true
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

    /* Olive-specific fields */
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
      autoCompleteFilterAttributes: ['oliveVariety.name'],
      exportable: true,
      dataTable: true
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
      autoCompleteFilterAttributes: ['oliveType.name'],
      exportable: true,
      dataTable: true
    }
  ],

  /* Actions pour les livraisons d'olives */
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter',        icon: 'visibility', value: 'CONSULTER' },
      { label: 'Modifier',         icon: 'edit',       value: 'MODIFIER' },
      { label: 'Supprimer',        icon: 'delete',     value: 'SUPPRIMER' },
      { label: 'Contrôle Qualité', icon: 'fact_check', value: 'QUALITY' }
    ]
  },

  /* Nom par défaut du fichier d’export CSV */
  fileName: 'olive_deliveries'
};

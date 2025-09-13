import {CreditState, UnitType} from '../../../../finance/models/OilCredit';
import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../../../shared/modules/osm-dashboard/models/dashboard-config';
import {SearchOperation} from '../../../../shared/models/advanced-search/searchOperation';

export const OIL_CREDIT_DASHBOARD: DashboardConfig = {
  icon: 'credit_score',
  title: "Gestion des crédits d'huile",
  titleTranslatePath: 'SUPPLIER.DETAILS.OIL_CREDIT_TOTAL',
  baseURL: 'finance/oil-credit',
  searchEndpoint: 'finance/oil-credit',
  addNewItem: false,
  addNewItemUrl: '/finance/oil-credit/new',
  specificActions: [
    {
      action: 'GEN_INVOICE',
      color: 'secondary',
      icon: 'file_copy',
      // disabled: {
      //   field: 'creditState',
      //   value: 'CANCELLED'
      // }
    }
  ],
  fileName: 'oil-credits',

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
      },
      searchs: []
    }
  },

  fields: [
    {
      name: 'emballage',
      label: 'Emballage',
      labelTranslatePath: 'OIL_CREDIT.FIELDS.PACKAGING',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Emballage'
    },
    {
      name: 'quantity',
      label: 'Quantité',
      labelTranslatePath: 'OIL_CREDIT.FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Quantité'
    },
    {
      name: 'unit',
      label: 'Unité',
      labelTranslatePath: 'OIL_CREDIT.FIELDS.UNIT',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      options: [
        {
          label: 'Litre',
          value: UnitType.L,
          labelTranslatePath: 'OIL_CREDIT.UNITS.LITER'
        },
        { label: 'Kilogramme', value: UnitType.KG, labelTranslatePath: 'OIL_CREDIT.UNITS.KILOGRAM' }
      ],
      exportLabel: 'Unité'
    },
    {
      name: 'oil_type',
      label: "Type d'huile",
      labelTranslatePath: 'OIL_CREDIT.FIELDS.OIL_TYPE',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'supplier.supplierInfo',
      label: 'Destinataire',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      dataTable: true,
      filterable: false,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'creditState',
      label: 'État du crédit',
      labelTranslatePath: 'OIL_CREDIT.FIELDS.CREDIT_STATE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      options: [
        {
          label: 'En attente',
          value: CreditState.PENDING,
          labelTranslatePath: 'OIL_CREDIT.STATES.PENDING'
        },
        {
          label: 'Approuvé',
          value: CreditState.APPROVED,
          labelTranslatePath: 'OIL_CREDIT.STATES.APPROVED'
        },
        {
          label: 'Rejeté',
          value: CreditState.REJECTED,
          labelTranslatePath: 'OIL_CREDIT.STATES.REJECTED'
        },
        {
          label: 'Terminé',
          value: CreditState.COMPLETED,
          labelTranslatePath: 'OIL_CREDIT.STATES.COMPLETED'
        },
        { label: 'Annulé', value: CreditState.CANCELLED, labelTranslatePath: 'OIL_CREDIT.STATES.CANCELLED' }
      ],
      exportLabel: 'État du crédit'
    },
    {
      name: 'createdDate',
      label: 'Date de création',
      labelTranslatePath: 'OIL_CREDIT.FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Date de création'
    }
  ]
};

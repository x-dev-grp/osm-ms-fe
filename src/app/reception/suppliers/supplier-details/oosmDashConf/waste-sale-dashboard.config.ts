import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';

export const WASTE_DASHBOARD: DashboardConfig = {
  icon: 'delete_sweep',
  title: 'Gestion des déchets',
  titleTranslatePath: 'WASTE.TITLE',
  baseURL: 'production/waste',
  searchEndpoint: 'production/waste',
  addNewItem: false,
  addNewItemUrl: '/finance/waste-sales/new',
  specificActions: [
    {
      action: 'PAY',
      color: 'primary',
      icon: 'payment',
      disabled: {
        field: 'paid',
        value: true
      }
    },
    {
      action: 'GEN_INVOICE',
      color: 'secondary',
      icon: 'file_copy',
      disabled: {
        field: 'paid',
        value: false
      }
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'saleDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false }
      },
      searchs: []
    }
  },

  fields: [
    {
      name: 'type',
      label: 'Type de déchet',
      labelTranslatePath: 'WASTE.FIELDS.TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'Margine', value: 'MARGINE', labelTranslatePath: 'WASTE.TYPES.MARGINE' },
        { label: 'Grignon', value: 'POMACE', labelTranslatePath: 'WASTE.TYPES.GRIGNON' },
        { label: 'Solides végétaux', value: 'VEGETAL_SOLIDS', labelTranslatePath: 'WASTE.TYPES.SOLID' },
        { label: 'Autre', value: 'OTHER', labelTranslatePath: 'WASTE.TYPES.OTHER' }
      ]
    },
    {
      name: 'quantityInKg',
      calculateTotal: true,
      label: 'Quantité (kg)',
      labelTranslatePath: 'WASTE.FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire (TND/kg)',
      calculateTotal: true,
      labelTranslatePath: 'WASTE.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'totalPrice',
      label: 'Prix total (TND)',

      calculateTotal: true,
      labelTranslatePath: 'WASTE.FIELDS.TOTAL_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'saleDate',
      label: 'Date de vente',
      labelTranslatePath: 'WASTE.FIELDS.SALE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    {
      name: 'paid',
      label: 'Payé ?',
      labelTranslatePath: 'WASTE.FIELDS.PAID',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplier',
      label: 'Fournisseur',
      labelTranslatePath: 'WASTE.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      valuePath: 'name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.name',
      getOptionsUrl: 'production/suppliers_type',
      exportable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'notes',
      label: 'Remarques',
      labelTranslatePath: 'WASTE.FIELDS.NOTES',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: false,
      filterable: false
    }
  ],

  fileName: 'waste_export'
};

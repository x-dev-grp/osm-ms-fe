import {SearchOperation} from "../../shared/models/advanced-search/searchOperation";
import {AttributeType, DashboardConfig, FieldType} from "../../shared/modules/osm-dashboard/models/dashboard-config";

export const WASTE_DASHBOARD: DashboardConfig = {
  icon: 'delete_sweep',
  title: 'Gestion des déchets',
  titleTranslatePath: 'WASTE.TITLE',
  baseURL: '/finance/waste-sales',
  searchEndpoint: 'finance/waste-sales',
  addNewItem: true,
  addNewItemUrl: '/finance/waste-sales/new',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'saleDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: {equalValue: false}
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
        {label: 'Margine', value: 'MARGINE', labelTranslatePath: 'WASTE.TYPES.MARGINE'},
        {label: 'Grignon', value: 'POMACE', labelTranslatePath: 'WASTE.TYPES.POMACE'},
        {label: 'Solides végétaux', value: 'VEGETAL_SOLIDS', labelTranslatePath: 'WASTE.TYPES.VEGETAL_SOLIDS'},
        {label: 'Autre', value: 'OTHER', labelTranslatePath: 'WASTE.TYPES.OTHER'}
      ]
    },
    {
      name: 'quantity',
      label: 'Quantité (kg)',
      labelTranslatePath: 'WASTE.FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire (TND/kg)',
      labelTranslatePath: 'WASTE.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: false
    },
    {
      name: 'totalPrice',
      label: 'Prix total (TND)',
      labelTranslatePath: 'WASTE.FIELDS.TOTAL_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
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
      name: 'invoiceNumber',
      label: 'N° Facture',
      labelTranslatePath: 'WASTE.FIELDS.INVOICE_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
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
      name: 'paymentDate',
      label: 'Date de paiement',
      labelTranslatePath: 'WASTE.FIELDS.PAYMENT_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'storageLocationCode',
      label: 'Code stockage',
      labelTranslatePath: 'WASTE.FIELDS.STORAGE_LOCATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false,
      dataTable: true,
      filterable: true
    },
    {
      name: 'customer',
      label: 'Client',
      labelTranslatePath: 'WASTE.FIELDS.CUSTOMER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
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
      valuePath: 'supplierInfo.name',
      valueAttributeType: AttributeType.string,
      filterAttribute: 'supplier.supplierInfo.name',
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

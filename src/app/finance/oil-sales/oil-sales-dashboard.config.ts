import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const OIL_SALES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'local_gas_station',
  title: "Ventes d'huile",
  titleTranslatePath: 'OIL_SALES.TITLE',
  baseURL: 'production/oil_sale',
  searchEndpoint: 'production/oil_sale',
  addNewItem: true,
  addNewItemUrl: 'finance/oil-sales/new',
  // specificActions: [
  //   {
  //     action: 'GEN_INVOICE',
  //     color: 'primary',
  //     icon: 'request_quote'
  //   }
  // ],
  fields: [
    // ==================== CORE SALE FIELDS ====================
    {
      name: 'invoiceNumber',
      label: 'Numéro de facture',
      labelTranslatePath: 'OIL_SALES.FIELDS.INVOICE_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'OIL_SALES.FIELDS.STATUS',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'PENDING', label: 'En attente', labelTranslatePath: 'OIL_SALES.STATUS.PENDING' },
        { value: 'CONFIRMED', label: 'Confirmé', labelTranslatePath: 'OIL_SALES.STATUS.CONFIRMED' },
        { value: 'DELIVERED', label: 'Livré', labelTranslatePath: 'OIL_SALES.STATUS.DELIVERED' },
        { value: 'CANCELLED', label: 'Annulé', labelTranslatePath: 'OIL_SALES.STATUS.CANCELLED' }
      ]
    },
    {
      name: 'saleDate',
      label: 'Date de vente',
      labelTranslatePath: 'OIL_SALES.FIELDS.SALE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'qualityGrade',
      label: 'qualityGrade',
      labelTranslatePath: 'OIL_TRANSACTION.DETAILS.QUALITY_GRADE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,

      options: [
        { value: 'VIRGIN', label: 'VIRGIN', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.VIRGIN' },
        {
          value: 'EXTRA_VIRGIN',
          label: 'EXTRA_VIRGIN',
          labelTranslatePath: 'PDF.OIL_GRADE.EXTRA_VIRGIN'
        },
        { value: 'LAMPANTE', label: 'LAMPANTE', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.LAMPANTE' },
        { value: 'REFINED', label: 'REFINED', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.REFINED' },
        { value: 'OTHER', label: 'OTHER', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.OTHER' }
      ]
    },
    // ==================== CUSTOMER INFORMATION ====================
    {
      name: 'customer.customerName',
      label: 'Client',
      labelTranslatePath: 'OIL_SALES.FIELDS.CUSTOMER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'customer.customerLastName',
      label: 'Nom du client',
      labelTranslatePath: 'OIL_SALES.FIELDS.CUSTOMER_LAST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== SUPPLIER INFORMATION ====================
    {
      name: 'supplier.name',
      label: 'Fournisseur',
      labelTranslatePath: 'OIL_SALES.FIELDS.SUPPLIER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== STORAGE UNIT INFORMATION ====================
    {
      name: 'storageUnit.name',
      label: 'Unité de stockage',
      labelTranslatePath: 'OIL_SALES.FIELDS.STORAGE_UNIT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oilType.name',
      label: "Type d'huile",
      labelTranslatePath: 'OIL_SALES.FIELDS.OIL_TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== QUANTITY & PRICING ====================
    {
      name: 'quantity',
      label: 'Quantité (L)',
      labelTranslatePath: 'OIL_SALES.FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire',
      isCurrency: true,
      currency: 'TND',
      labelTranslatePath: 'OIL_SALES.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'totalAmount',
      label: 'Montant total',
      labelTranslatePath: 'OIL_SALES.FIELDS.TOTAL_AMOUNT',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'currency',
      label: 'Devise',
      labelTranslatePath: 'OIL_SALES.FIELDS.CURRENCY',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'TND', label: 'TND' },
        { value: 'EUR', label: 'EUR' },
        { value: 'USD', label: 'USD' }
      ]
    },

    // ==================== PAYMENT INFORMATION ====================
    {
      name: 'paymentMethod',
      label: 'Méthode de paiement',
      labelTranslatePath: 'OIL_SALES.FIELDS.PAYMENT_METHOD',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'CASH', label: 'Espèces', labelTranslatePath: 'OIL_SALES.PAYMENT_METHODS.CASH' },
        { value: 'CHEQUE', label: 'Chèque', labelTranslatePath: 'OIL_SALES.PAYMENT_METHODS.CHEQUE' },
        { value: 'TRANSFER', label: 'Virement', labelTranslatePath: 'OIL_SALES.PAYMENT_METHODS.TRANSFER' }
      ]
    },
    {
      name: 'bankAccount',
      label: 'Compte bancaire',
      labelTranslatePath: 'OIL_SALES.FIELDS.BANK_ACCOUNT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'checkNumber',
      label: 'Numéro de chèque',
      labelTranslatePath: 'OIL_SALES.FIELDS.CHECK_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'externalTransactionId',
      label: 'ID Transaction externe',
      labelTranslatePath: 'OIL_SALES.FIELDS.EXTERNAL_TRANSACTION_ID',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== ADDITIONAL INFORMATION ====================
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'OIL_SALES.FIELDS.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false, // Description is not sortable
      dataTable: false, // Hide from main table, available in details
      filterable: false // Description is not filterable
    },

    // ==================== DELIVERY INFORMATION ====================
    {
      name: 'deliveryDate',
      label: 'Date ',
      labelTranslatePath: 'OIL_SALES.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'deliveryAddress',
      label: 'Adresse de réception',
      labelTranslatePath: 'OIL_SALES.FIELDS.DELIVERY_ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false, // Address is not sortable
      dataTable: false, // Hide from main table, available in details
      filterable: false // Address is not filterable
    },
    {
      name: 'deliveryNotes',
      label: 'Notes de réception',
      labelTranslatePath: 'OIL_SALES.FIELDS.DELIVERY_NOTES',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false, // Notes are not sortable
      dataTable: false, // Hide from main table, available in details
      filterable: false // Notes are not filterable
    },

    // ==================== PAYMENT STATUS ====================
    {
      name: 'paid',
      label: 'Payé',
      labelTranslatePath: 'SUPPLIER_PAYMENT.STATUS_PAID',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },

    // ==================== SYSTEM FIELDS ====================
    {
      name: 'createdDate',
      label: 'Date de création',
      labelTranslatePath: 'OIL_SALES.FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'lastModifiedDate',
      label: 'Dernière modification',
      labelTranslatePath: 'OIL_SALES.FIELDS.LAST_MODIFIED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'legalName',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false }
      },
      searchs: []
    }
  },
  /* ── Menu actions ───────────────────────── */
  fileName: 'ventes-huile'
};

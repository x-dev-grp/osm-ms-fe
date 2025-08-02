import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/osm-dashboard/models/dashboard-config';

export const OIL_SALES_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'local_gas_station',
  title: "Ventes d'huile",
  baseURL: 'finance/oil-sales',
  searchEndpoint: 'finance/oil_sale',
  addNewItem: false,
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
        {
          value: 'PENDING',
          label: 'En attente',
          labelTranslatePath: 'OIL_SALES.STATUS.PENDING'
        },
        {
          value: 'CONFIRMED',
          label: 'Confirmé',
          labelTranslatePath: 'OIL_SALES.STATUS.CONFIRMED'
        },
        { value: 'DELIVERED', label: 'Livré', labelTranslatePath: 'OIL_SALES.STATUS.DELIVERED' },
        {
          value: 'CANCELLED',
          label: 'Annulé',
          labelTranslatePath: 'OIL_SALES.STATUS.CANCELLED'
        }
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
      name: 'customer.customerLastName',
      label: 'Nom du client',
      labelTranslatePath: 'SUPPLIER.FIELDS.LASTNAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },

    // ==================== SUPPLIER INFORMATION ====================
    {
      name: 'supplier.supplierInfo.name',
      label: 'Fournisseur',
      labelTranslatePath: 'OIL_SALES.FIELDS.SUPPLIER',
      attributeType: AttributeType.object,
      fieldType: FieldType.autocomplete,
      exportable: true,
      sortable: true,
      dataTable: true, // Hide from main table, available in details
      filterable: true,
      valuePath: 'name'
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
      filterable: true,
      valuePath: 'name'
    },
    {
      name: 'oilType.name',
      label: "Type d'huile",
      labelTranslatePath: 'OIL_SALES.OIL_TYPE',
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
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'unitPrice',
      label: 'Prix unitaire',
      labelTranslatePath: 'OIL_SALES.FIELDS.UNIT_PRICE',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
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
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'currency',
      label: 'Devise',
      labelTranslatePath: 'OIL_SALES.FIELDS.CURRENCY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'TND', label: 'TND', labelTranslatePath: 'OIL_SALES.CURRENCIES.TND' },
        {
          value: 'EUR',
          label: 'EUR',
          labelTranslatePath: 'OIL_SALES.CURRENCIES.EUR'
        },
        { value: 'USD', label: 'USD', labelTranslatePath: 'OIL_SALES.CURRENCIES.USD' }
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
        {
          value: 'CASH',
          label: 'Espèces',
          labelTranslatePath: 'OIL_SALES.PAYMENT_METHODS.CASH'
        },
        {
          value: 'CHEQUE',
          label: 'Chèque',
          labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.CHECK'
        },
        { value: 'TRANSFER', label: 'Virement', labelTranslatePath: 'TRANSACTIONS.PAYMENT_METHODS.BANK_TRANSFER' }
      ]
    },
    {
      name: 'bankAccount',
      label: 'Compte bancaire',
      labelTranslatePath: 'BANK_ACCOUNTS.FIELDS.BANK_NAME',
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
      labelTranslatePath: 'SUPPLIER_PAYMENT.CHECK_NUMBER',
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
      labelTranslatePath: 'OIL_SALES.DESCRIPTION',
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
      label: 'Date de livraison',
      labelTranslatePath: 'CONTROLE_QUALITE.FORM.FIELDS.DELIVERY_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    },
    {
      name: 'deliveryAddress',
      label: 'Adresse de livraison',
      labelTranslatePath: 'CONFIGURATION.SITE.FIELDS.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: false, // Address is not sortable
      dataTable: false, // Hide from main table, available in details
      filterable: false // Address is not filterable
    },
    {
      name: 'deliveryNotes',
      label: 'Notes de livraison',
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
      labelTranslatePath: 'OIL_SALES.LAST_MODIFIED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: false, // Hide from main table, available in details
      filterable: true
    }
  ],

  /* ── Menu actions ───────────────────────── */
  fileName: 'ventes-huile'
};

import { AttributeType, DashboardConfig, FieldType } from '../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'warehouse',
  title: 'Gestion des réservoirs',
  titleTranslatePath: 'AUTO.GESTION_DES_RESERVOIRS',
  baseURL: 'production/storage-units',
  searchEndpoint: 'production/storage-units',
  addNewItem: true,
  addNewItemUrl: '/storage/new',
  fileName: 'storage-units',
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  },

  fields: [
    {
      name: 'name',
      label: 'Nom',
      labelTranslatePath: 'CONFIGURATION.RECEPTION.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,

      dataTable: true,
      exportable: true,
      exportLabel: 'Nom',
      filterAttribute: 'name'
    },
    // {
    //   name: 'lotNumber',
    //   label: 'lotNumber',
    //   labelTranslatePath: 'DELIVERIES.FIELDS.LOT_NUMBER',
    //   attributeType: AttributeType.string,
    //   fieldType: FieldType.text,
    //   sortable: true,
    //   filterable: true,
    //   dataTable: true,
    //   exportable: true,
    //   exportLabel: 'lotNumber',
    //   filterAttribute: 'lotNumber'
    // },
    // {
    //   name: 'location',
    //   label: 'Emplacement',
    //   labelTranslatePath: 'OIL_CONTAINER.FORM.STORAGE_LOCATION',
    //   attributeType: AttributeType.string,
    //   fieldType: FieldType.text,
    //   sortable: true,
    //   filterable: true,
    //
    //   dataTable: true,
    //   exportable: true
    // },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'OIL_SALES.DESCRIPTION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: false,
      defaultFilter: false,
      dataTable: false,
      exportable: true
    },
    {
      name: 'maxCapacity',
      label: 'Capacité (KG)',
      labelTranslatePath: 'STORAGE.VIEW.MAX_CAPACITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: false,
      dataTable: true,
      exportable: true
    },
    // {
    //   name: 'supplier',
    //   label: 'Fournisseur',
    //   labelTranslatePath: 'DELIVERIES.FIELDS.SUPPLIER',
    //   attributeType: AttributeType.object,
    //   fieldType: FieldType.autocomplete,
    //   exportable: true,
    //   dataTable: true,
    //   filterable: true,
    //   valuePath: 'name',
    //   valueAttributeType: AttributeType.string,
    //   filterAttribute: 'supplier.name',
    //   getOptionsUrl: 'production/suppliers_type'
    // },
    {
      name: 'avgCost',
      label: 'Average cost',
      labelTranslatePath: 'STORAGE.VIEW.AVGCOST',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'totalCost',
      label: 'Total cost',
      labelTranslatePath: 'STORAGE.VIEW.TOTALCOST',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'currentVolume',
      label: 'Volume (KG)',
      labelTranslatePath: 'STORAGE.VIEW.CURRENT_VOLUME',
      attributeType: AttributeType.number,
      fieldType: FieldType.text,
      sortable: true,
      filterable: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'filteredOil',
      label: 'Pour filtrage',
      labelTranslatePath: 'AUTO.POUR_FILTRAGE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      sortable: true,
      filterable: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'status',
      label: 'Statut',
      labelTranslatePath: 'SUPPLIER_PAYMENT.STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,

      dataTable: true,
      options: [
        {
          label: 'Disponible',
          value: 'AVAILABLE',
          labelTranslatePath: 'STORAGE.VIEW.STATUS.AVAILABLE'
        },
        { label: 'Pleine', value: 'FULL', labelTranslatePath: 'STORAGE.VIEW.STATUS.FULL' },
        {
          label: 'Remplissage',
          value: 'FILLING',
          labelTranslatePath: 'STORAGE.VIEW.STATUS.FILLING'
        },
        {
          label: 'Maintenance',
          value: 'MAINTENANCE',
          labelTranslatePath: 'STORAGE.VIEW.STATUS.MAINTENANCE'
        },
        { label: 'En service', value: 'STORAGE.VIEW.STATUS.IN_USE', labelTranslatePath: 'STORAGE.VIEW.STATUS.IN_USE' },
        {
          label: 'Nettoyage',
          value: 'CLEANING',
          labelTranslatePath: 'STORAGE.VIEW.STATUS.CLEANING'
        },
        {
          label: 'Réservée',
          value: 'RESERVED',
          labelTranslatePath: 'STORAGE.VIEW.STATUS.RESERVED'
        },
        { label: 'Hors service', value: 'OUT_OF_SERVICE', labelTranslatePath: 'STORAGE.VIEW.STATUS.OUT_OF_SERVICE' }
      ],
      exportable: true
    },
    // {
    //   name: 'qualityGrade',
    //   label: 'quality Grade',
    //   labelTranslatePath: 'OIL_TRANSACTION.DETAILS.QUALITY_GRADE',
    //   attributeType: AttributeType.enum,
    //   fieldType: FieldType.select,
    //   sortable: true,
    //   filterable: true,
    //   dataTable: true,
    //   options: [
    //     { value: 'VIRGIN', label: 'VIRGIN', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.VIRGIN' },
    //     {
    //       value: 'EXTRA_VIRGIN',
    //       label: 'EXTRA_VIRGIN',
    //       labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.EXTRA_VIRGIN'
    //     },
    //     { value: 'LAMPANTE', label: 'LAMPANTE', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.LAMPANTE' },
    //     { value: 'REFINED', label: 'REFINED', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.REFINED' },
    //     { value: 'OTHER', label: 'OTHER', labelTranslatePath: 'OIL_TRANSACTIONS.QUALITY_GRADES.OTHER' }
    //   ],
    //   exportable: true
    // },
    // {
    //   name: 'oilVariety',
    //   label: 'Oil Variety',
    //   valuePath: 'name',
    //   labelTranslatePath: 'OIL_TRANSACTION.DELIVERY.OIL_VARIETY',
    //   attributeType: AttributeType.string,
    //   fieldType: FieldType.autocomplete,
    //   sortable: true,
    //   filterable: true,
    //   dataTable: true,
    //   exportable: true,
    //   getOptionsUrl: 'production/types',
    //   autoCompleteDefaultCriteria: {
    //     page: 0,
    //     size: 10,
    //     sort: 'createdDate',
    //     order: 'DESC',
    //     searchData: {
    //       operation: SearchOperation.AND,
    //       searchs: [],
    //       search: {
    //         isDeleted: {
    //           equalValue: false
    //         },
    //         type: {
    //           equalValue: TypeCategory.OIL_VARIETY
    //         }
    //       }
    //     }
    //   },
    //   autoCompleteFilterAttributes: ['name']
    // },
    {
      name: 'nextMaintenanceDate',
      label: 'Prochaine maintenance',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.NEXT_MAINTENANCE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: false,
      filterable: false,
      dataTable: false,
      exportable: false
    },
    {
      name: 'lastInspectionDate',
      label: 'Dernière inspection',
      labelTranslatePath: 'MILL_MACHINE.FIELDS.LAST_MAINTENANCE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: false,
      filterable: false,
      dataTable: false,
      exportable: false
    }
  ]
};

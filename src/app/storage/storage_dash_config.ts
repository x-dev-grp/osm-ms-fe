import { AttributeType, DashboardConfig, FieldType } from '../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../shared/models/advanced-search/searchOperation';
import { TypeCategory } from '../shared/models/type-category.enum';

export const dashboardConfig: DashboardConfig = {
  icon: 'warehouse',
    title: 'Gestion des réservoirs',
    baseURL: 'production/storage-units',
    searchEndpoint: 'production/storage-units',
    addNewItem: true,
    addNewItemUrl: '/storage/new',
    fileName: 'storage-units',

    fields: [
      {
        name: 'name',
        label: 'Nom',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        exportable: true,
        exportLabel: 'Nom',
        filterAttribute: 'name'
      },
      {
        name: 'location',
        label: 'Emplacement',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        exportable: true
      },{
        name: 'description',
        label: 'Description',
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
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },     {
        name: 'supplier',
        label: 'Fournisseur',
        labelTranslatePath: 'DELIVERIES.FIELDS.SUPPLIER',
        attributeType: AttributeType.object,
        fieldType: FieldType.autocomplete,
        exportable: true,
        dataTable: true,
        filterable: true,
        valuePath: 'supplierInfo.name',
        valueAttributeType: AttributeType.string,
        filterAttribute: 'supplier.supplierInfo.name',
        getOptionsUrl:'production/suppliers_type'
      },
      {
        name: 'avgCost',
        label: 'Average cost',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },
      {
        name: 'totalCost',
        label: 'Total cost',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },
      {
        name: 'currentVolume',
        label: 'Volume (KG)',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },
      {
        name: 'status',
        label: 'Statut',
        attributeType: AttributeType.string,
        fieldType: FieldType.select,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        options: [
          { label: 'Disponible', value: 'AVAILABLE' },
          { label: 'Pleine', value: 'FULL' },
          { label: 'Remplissage', value: 'FILLING' },
          { label: 'Maintenance', value: 'MAINTENANCE' },
          { label: 'En service', value: 'IN_USE' },
          { label: 'Nettoyage', value: 'CLEANING' },
          { label: 'Réservée', value: 'RESERVED' },
          { label: 'Hors service', value: 'OUT_OF_SERVICE' }
        ],
        exportable: true
      },
      {
        name: 'oilType.name',
        label: 'Oil TYPE',
        valuePath: 'oilVariety.name',
        attributeType: AttributeType.string,
        fieldType: FieldType.autocomplete,
        sortable: true,
        filterable: true,
        dataTable: true,
        exportable: true,
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
              isDeleted:{
                equalValue:false
              },type: {
                equalValue: TypeCategory.OIL_VARIETY
              }
            }
          }
        },
        autoCompleteFilterAttributes: ['name']
      },
      {
        name: 'nextMaintenanceDate',
        label: 'Prochaine maintenance',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        sortable: true,
        filterable: true,
        dataTable: false,
        exportable: true
      },
      {
        name: 'lastInspectionDate',
        label: 'Dernière inspection',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        sortable: true,
        filterable: true,
        dataTable: false,
        exportable: true
      }
    ]
  };

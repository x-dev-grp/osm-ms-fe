import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { deliveryType } from '../../../shared/models/deleveryType';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const QUALITY_CONTROL_DASHBOARD: DashboardConfig = {
  title: 'Contrôle Qualité',
  titleTranslatePath: 'QUALITY_CONTROL.TITLE',
  baseURL: 'quality-control',
  searchEndpoint: 'production/deliveries',
  addNewItem: false,
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        hasQualityControl: {
          equalValue: "false"
        }
      }
    }
  },
  fields: [
    {
      name: 'deliveryNumber',
      label: 'N° Bon de réception',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: false,
      filterable: true
    },
    {
      name: 'lotNumber',
      label: 'N° Lot',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'deliveryType',
      label: 'Type de livraison',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      defaultFilter:true,
      options: [
        { label: 'Olive', value: deliveryType.OLIVE },
        { label: 'Huile', value: deliveryType.OIL }
      ]
    },
    {
      name: 'deliveryDate',
      label: 'Date de livraison',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'supplier.supplierInfo',
      label: 'Fournisseur',
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'poidsNet',
      label: 'Poids net (kg)',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'oliveType',
      label: "Type d'olive",
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'oliveVariety',
      label: "Variété d'olive",
      attributeType: AttributeType.object,
      fieldType: FieldType.text,
      exportable: true,
      dataTable: true,
      filterable: true,
      valuePath: 'name',
      valueAttributeType: AttributeType.string
    },
    {
      name: 'status',
      label: 'Statut',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { label: 'En attente', value: 'PENDING' },
        { label: 'En cours', value: 'IN_PROGRESS' },
        { label: 'Terminé', value: 'COMPLETED' },
        { label: 'Refusé', value: 'REJECTED' }
      ]
    }
  ],
  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Démarrer contrôle', icon: 'fact_check', value: 'START_CONTROL' },
      { label: 'Consulter', icon: 'visibility', value: 'VIEW' }
    ]
  },
  fileName: 'quality_control_list'
};

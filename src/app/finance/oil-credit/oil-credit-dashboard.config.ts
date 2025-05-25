import { DashboardConfig, AttributeType, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const OIL_CREDIT_DASHBOARD: DashboardConfig = {
  title: 'Gestion des crédits d\'huile',
  baseURL: 'oil-credit',
  searchEndpoint: 'finance/oil-credit',
  addNewItem: true,
  addNewItemUrl: '/finance/oil-credit/new',
  fileName: 'oil-credits',

  actions: {
    statusMapping: false,
    statusAttributeName: 'status',
    actionsList: [
      { label: 'Consulter', icon: 'visibility', value: 'view' },
      { label: 'Modifier', icon: 'edit', value: 'edit' },
      { label: 'Supprimer', icon: 'delete', value: 'delete' }
    ],
    actionsStatusList: {}
  },

  fields: [
    {
      name: 'credit_date',
      label: 'Date',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Date'
    },
    {
      name: 'citerne_pile.name',
      label: 'Citerne / Pile',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Citerne / Pile'
    },
    {
      name: 'emballage',
      label: 'Emballage',
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
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      options: [
        { label: 'Litre', value: 'L' },
        { label: 'Kilogramme', value: 'KG' }
      ],
      exportLabel: 'Unité'
    },
    {
      name: 'destinataire',
      label: 'Destinataire',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Destinataire'
    }
  ]
};

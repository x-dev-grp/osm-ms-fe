import { DashboardConfig, AttributeType, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { CreditState, UnitType } from '../models/OilCredit';

export const OIL_CREDIT_DASHBOARD: DashboardConfig = {
  title: 'Gestion des crédits d\'huile',
  baseURL: 'finance/oil-credit',
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
      fieldType: FieldType.number,
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
        { label: 'Litre', value: UnitType.L },
        { label: 'Kilogramme', value: UnitType.KG }
      ],
      exportLabel: 'Unité'
    },
    {
      name: 'oil_type',
      label: 'Type d\'huile',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'Type d\'huile'
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
    },
    {
      name: 'creditState',
      label: 'État du crédit',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      dataTable: true,
      exportable: true,
      options: [
        { label: 'En attente', value: CreditState.PENDING },
        { label: 'Approuvé', value: CreditState.APPROVED },
        { label: 'Rejeté', value: CreditState.REJECTED },
        { label: 'Terminé', value: CreditState.COMPLETED },
        { label: 'Annulé', value: CreditState.CANCELLED }
      ],
      exportLabel: 'État du crédit'
    },
    {
      name: 'createdDate',
      label: 'Date de création',
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

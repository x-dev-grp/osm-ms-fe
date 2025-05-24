import {
  AttributeType,
  DashboardConfig,
  FieldType
} from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { UnitType } from '../models/OilCredit';

export const OIL_CREDIT_DASHBOARDFile: DashboardConfig = {
  title: "Crédits d'huile",
  titleTranslatePath: 'FINANCE.OIL_CREDITS.TITLE',
  baseURL: 'finance/oil-credit',
  searchEndpoint: 'finance/oil-credit',

  addNewItem: true,
  addNewItemUrl: 'finance/oil-credits/new',

  fields: [
    // Identifiant interne
    {
      name: 'id',
      label: 'ID',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: false,
      sortable: false,
      dataTable: false
    },

    // Date du crédit
    {
      name: 'credit_date',
      label: 'Date',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true
    },

    // Citerne / Pile
    {
      name: 'citerne_pile',
      label: 'Citerne/Pile',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },

    // Type d'emballage
    {
      name: 'emballage',
      label: 'Emballage',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    },

    // Quantité créditée
    {
      name: 'quantity',
      label: 'Quantité',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true
    },

    // Unité (KG ou L)
    {
      name: 'unit',
      label: 'Unité',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      options: [
        { label: UnitType.KG, value: UnitType.KG },
        { label: UnitType.L, value: UnitType.L }
      ]
    },

    // Destinataire
    {
      name: 'destinataire',
      label: 'Destinataire',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true
    }
  ],

  actions: {
    statusMapping: false,
    statusAttributeName: 'name',
    actionsList: [
      { label: 'Consulter', icon: '',       value: 'CONSULTER' },
      { label: 'Modifier',  icon: 'edit',   value: 'MODIFIER'  },
      { label: 'Supprimer', icon: 'delete', value: 'SUPPRIMER' }
    ]
  },

  fileName: 'oil_credits'
};

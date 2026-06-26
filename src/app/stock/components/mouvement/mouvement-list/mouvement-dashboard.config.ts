import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const MOUVEMENT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'swap_horiz',
  title: 'Flux des mouvements',
  titleTranslatePath: 'DASHBOARD_TITLES.STOCK_MOVEMENTS',
  baseURL: 'inventaire/mouvements-stocks',
  searchEndpoint: 'inventaire/mouvements-stocks',
  addNewItem: false,
  fileName: 'mouvements-stock',
  fields: [
    {
      name: 'dateMouvement',
      label: 'Date',
      labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'article.code',
      label: 'Code article',
      labelTranslatePath: 'DASHBOARD_FIELDS.ARTICLE_CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'article.nom',
      label: 'Article',
      labelTranslatePath: 'DASHBOARD_FIELDS.ARTICLE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'typeMouvement',
      label: 'Type',
      labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_TYPE',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'ENTREE', label: 'Entree', labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_ENTRY' },
        { value: 'SORTIE', label: 'Sortie', labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_EXIT' },
        { value: 'AJUSTEMENT', label: 'Ajustement', labelTranslatePath: 'DASHBOARD_FIELDS.MOVEMENT_ADJUSTMENT' }
      ]
    },
    {
      name: 'quantite',
      label: 'Quantite',
      labelTranslatePath: 'DASHBOARD_FIELDS.QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'motif',
      label: 'Motif',
      labelTranslatePath: 'DASHBOARD_FIELDS.REASON',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'dateMouvement',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: {
          equalValue: false
        }
      },
      searchs: []
    }
  }
};

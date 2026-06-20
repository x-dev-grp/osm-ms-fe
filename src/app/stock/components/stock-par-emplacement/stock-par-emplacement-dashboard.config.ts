import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';

export const STOCK_PAR_EMPLACEMENT_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'warehouse',
  title: 'Stock par Emplacement',
  titleTranslatePath: 'DASHBOARD_TITLES.STOCK_BY_LOCATION',
  baseURL: 'inventaire/stocks',
  searchEndpoint: 'inventaire/stocks',
  addNewItem: false,
  fileName: 'stock-par-emplacement',
  specificActions: [{ action: 'READ_ARTICLE', color: 'primary', icon: 'visibility' }],
  fields: [
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
      name: 'article.categorie',
      label: 'Categorie',
      labelTranslatePath: 'DASHBOARD_FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'emplacement.code',
      label: 'Emplacement',
      labelTranslatePath: 'DASHBOARD_FIELDS.LOCATION',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteActuelle',
      label: 'Quantite actuelle',
      labelTranslatePath: 'DASHBOARD_FIELDS.CURRENT_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteReservee',
      label: 'Quantite reservee',
      labelTranslatePath: 'DASHBOARD_FIELDS.RESERVED_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'quantiteDisponible',
      label: 'Quantite disponible',
      labelTranslatePath: 'DASHBOARD_FIELDS.AVAILABLE_QUANTITY',
      attributeType: AttributeType.number,
      fieldType: FieldType.number,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'createdDate',
      label: 'Date de creation',
      labelTranslatePath: 'DASHBOARD_FIELDS.CREATED_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    }
  ],
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: { isDeleted: { equalValue: false } },
      searchs: []
    }
  }
};

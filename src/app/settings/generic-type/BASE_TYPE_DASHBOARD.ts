import { TypeCategory } from '../../shared/models/type-category.enum';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

const TYPE_OPTIONS = [
  { label: 'Région', value: TypeCategory.REGION, labelTranslatePath: 'BASE_TYPE.REGION' },
  { label: 'Parcelle', value: TypeCategory.PARCEL, labelTranslatePath: 'BASE_TYPE.PARCEL' },
  { label: 'Type de fournisseur', value: TypeCategory.SUPPLIER_TYPE, labelTranslatePath: 'BASE_TYPE.SUPPLIER_TYPE' },
  { label: "Variété d'olive", value: TypeCategory.OLIVE_VARIETY, labelTranslatePath: 'BASE_TYPE.OLIVE_VARIETY' },
  { label: "Variété d'huile", value: TypeCategory.OIL_VARIETY, labelTranslatePath: 'BASE_TYPE.OIL_VARIETY' },
  { label: 'Type de déchets', value: TypeCategory.WASTE_TYPE, labelTranslatePath: 'BASE_TYPE.WASTE_TYPE' },
  { label: "Type d'olive", value: TypeCategory.OLIVE_TYPE, labelTranslatePath: 'BASE_TYPE.OLIVE_TYPE' },
  { label: "Type d'huile", value: TypeCategory.OIL_TYPE, labelTranslatePath: 'BASE_TYPE.OIL_TYPE' },
  { label: 'Méthode de production', value: TypeCategory.PRODUCTION_METHOD, labelTranslatePath: 'BASE_TYPE.PRODUCTION_METHOD' }
];

export const BASE_TYPE: DashboardConfig = {
  icon: 'category',
  title: 'Generic Type Management',
  titleTranslatePath: 'BASE_TYPE.TITLE',
  baseURL: 'production/types',
  searchEndpoint: 'production/types',
  addNewItem: true,
  fileName: 'generic-type',
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
      label: 'Name',
      labelTranslatePath: 'BASE_TYPE.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true,
      exportLabelTranslatePath: 'BASE_TYPE.FIELDS.NAME',
      filterAttribute: 'name'
    },
    {
      name: 'description',
      label: 'Description',
      labelTranslatePath: 'BASE_TYPE.FIELDS.DESCRIPTION',
      valuePath: 'description',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      exportLabelTranslatePath: 'BASE_TYPE.FIELDS.DESCRIPTION',
      filterAttribute: 'description'
    },
    {
      name: 'type',
      label: 'Type',
      labelTranslatePath: 'BASE_TYPE.FIELDS.TYPE',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      options: TYPE_OPTIONS,
      exportable: true,
      exportLabelTranslatePath: 'BASE_TYPE.FIELDS.TYPE'
    }
  ]
};

export const BASE_TYPE_CATEGORIES: TypeCategory[] = [
  TypeCategory.REGION,
  TypeCategory.PARCEL,
  TypeCategory.SUPPLIER_TYPE,
  TypeCategory.OLIVE_VARIETY,
  TypeCategory.OIL_VARIETY,
  TypeCategory.WASTE_TYPE
];

 import { TypeCategory } from '../../shared/models/type-category.enum';
 import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';

export const BASE_TYPE: DashboardConfig = {
  icon: 'water_drop',
  title: 'Generic Type Management',
  baseURL: 'generic-type',
  searchEndpoint: 'production/types',
  addNewItem: true,
  addNewItemUrl: '/settings/generic/new',
  fileName: 'generic-type',
  fields: [
    {
      name: 'name',
      label: 'Name',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      exportLabel: 'Name',
      exportLabelTranslatePath: 'generic-type.name',
      filterAttribute: 'name'
    },
    {
      name: 'description',
      label: 'Description',
      valuePath: 'description',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'type',
      label: 'Type',
      attributeType: AttributeType.string,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      options: [
        /** Liste d’options – étiquettes en français, valeurs = énum */

        { label: 'Type de déchets', value: TypeCategory.WASTE_TYPE },
        {
          label: 'Région',
          value: TypeCategory.REGION
        },
        {
          label: "Variété d'olive",
          value: TypeCategory.OLIVE_VARIETY
        },
        { label: "Type d'olive", value: TypeCategory.OLIVE_TYPE },
        {
          label: "Type d'huile",
          value: TypeCategory.OIL_TYPE
        },
        {
          label: 'Méthode de production',
          value: TypeCategory.PRODUCTION_METHOD
        },
        { label: "Variété d'huile", value: TypeCategory.OIL_VARIETY }
      ],
      exportable: true
    }
  ]
};

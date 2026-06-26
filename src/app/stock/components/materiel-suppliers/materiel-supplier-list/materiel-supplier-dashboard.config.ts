import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const MATERIEL_SUPPLIER_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'local_shipping',
  title: 'Material suppliers',
  titleTranslatePath: 'DASHBOARD_TITLES.MATERIEL_SUPPLIERS',
  baseURL: 'inventaire/materiel-suppliers',
  searchEndpoint: 'inventaire/materiel-suppliers',
  addNewItem: true,
  addNewItemUrl: '/stock/materiel-suppliers/nouveau',
  fileName: 'materiel-suppliers',
  specificActions: [
    { action: 'READ', color: 'primary', icon: 'visibility' },
    { action: 'UPDATE', color: 'accent', icon: 'edit' },
    { action: 'TOGGLE_ACTIVE', color: 'primary', icon: 'power_settings_new' }
  ],
  fields: [
    {
      name: 'code',
      label: 'Code',
      labelTranslatePath: 'DASHBOARD_FIELDS.CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'nom',
      label: 'Nom',
      labelTranslatePath: 'DASHBOARD_FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'DASHBOARD_FIELDS.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'telephone',
      label: 'Telephone',
      labelTranslatePath: 'DASHBOARD_FIELDS.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'category',
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
      name: 'pays',
      label: 'Pays',
      labelTranslatePath: 'DASHBOARD_FIELDS.COUNTRY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'actif',
      label: 'Actif',
      labelTranslatePath: 'ADMIN_DASHBOARD.HERO.ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
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

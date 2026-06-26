import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';
import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';

export const CERTIFICATION_DASHBOARD_CONFIG: DashboardConfig = {
  icon: 'workspace_premium',
  title: 'Gestion des Certifications',
  titleTranslatePath: 'DASHBOARD_TITLES.CERTIFICATIONS',
  baseURL: 'certifications',
  searchEndpoint: 'certifications',
  addNewItem: true,
  fileName: 'certifications',
  specificActions: [
    {
      action: 'READ',
      color: 'primary',
      icon: 'visibility'
    },
    {
      action: 'UPDATE',
      color: 'accent',
      icon: 'edit'
    },
    {
      action: 'REMOVE',
      color: 'warn',
      icon: 'delete'
    }
  ],
  fields: [
    {
      name: 'name',
      label: 'Nom',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'code',
      label: 'Code',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.CODE',
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
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.CATEGORY',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true,
      options: [
        { value: 'LEGAL', label: 'Legale', labelTranslatePath: 'CERTIFICATIONS.CATEGORIES.LEGAL' },
        { value: 'QUALITY', label: 'Qualite', labelTranslatePath: 'CERTIFICATIONS.CATEGORIES.QUALITY' },
        { value: 'MARKETING', label: 'Marketing', labelTranslatePath: 'CERTIFICATIONS.CATEGORIES.MARKETING' }
      ]
    },
    {
      name: 'issuingBody',
      label: 'Organisme',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.ISSUING_BODY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'websiteUrl',
      label: 'Site web',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.WEBSITE_URL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      exportable: true,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'isActive',
      label: 'Statut',
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.STATUS',
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
      labelTranslatePath: 'CERTIFICATIONS.FIELDS.CREATED_DATE',
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
      search: {
        isDeleted: {
          equalValue: false
        }
      },
      searchs: []
    }
  }
};

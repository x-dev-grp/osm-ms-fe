import { AttributeType, DashboardConfig, FieldType } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

export const companyProfileDashboardConfig: DashboardConfig = {
  icon: 'business',
  title: 'Company Profiles',
  titleTranslatePath: 'MENU.ADMINISTRATION.COMPANY_PROFILES',
  baseURL: 'security/company-profile',
  searchEndpoint: 'security/company-profile',
  addNewItem: true,
  addNewItemUrl: '/administration/add-company-user',
  filterTenant: false,
  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'legalName',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      search: {
        isDeleted: { equalValue: false }
      },
      searchs: []
    }
  },
  fields: [
    {
      name: 'legalName',
      label: 'Legal Name',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.LEGAL_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'registrationNumber',
      label: 'Registration Number',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.REG_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'taxId',
      label: 'Tax ID',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.TAX_ID',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'legalForm',
      label: 'Legal Form',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.LEGAL_FORM',
      dataTable: true,
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'capital',
      label: 'Capital',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.CAPITAL',
      attributeType: AttributeType.number,
      dataTable: true,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.EMAIL',
      dataTable: true,
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'phone',
      label: 'Phone',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.PHONE',
      dataTable: true,
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'city',
      label: 'City',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.CITY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      dataTable: true,
      sortable: true,
      filterable: true
    },
    {
      name: 'governorate',
      label: 'Governorate',
      labelTranslatePath: 'ADMIN_COMPANY_PROFILE.GOVERNORATE',
      attributeType: AttributeType.string,
      dataTable: true,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    }
  ]
};

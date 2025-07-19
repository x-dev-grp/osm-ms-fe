import { AttributeType, DashboardConfig, FieldType } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';

export const companyProfileDashboardConfig: DashboardConfig = {
  icon: 'business',
  title: 'Company Profiles',
  titleTranslatePath: 'MENU.ADMINISTRATION.COMPANY_PROFILES',
  baseURL: 'company-profile',
  searchEndpoint: 'security/company-profile',
  addNewItem: true,
  addNewItemUrl: '/administration/add-company-user',
  filterTenant:false,
  fields: [
    {
      name: 'legalName',
      label: 'Legal Name',
      labelTranslatePath: 'GENERAL_CONFIG.COMPANY_INFO.LEGAL_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,
      filterable: true
    },
    {
      name: 'registrationNumber',
      label: 'Registration Number',
      labelTranslatePath: 'GENERAL_CONFIG.COMPANY_INFO.REG_NUMBER',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,

      filterable: true
    },
    {
      name: 'taxId',
      label: 'Tax ID',
      labelTranslatePath: 'GENERAL_CONFIG.COMPANY_INFO.TAX_ID',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      dataTable: true,

      filterable: true
    },
    {
      name: 'legalForm',
      label: 'Legal Form',
      labelTranslatePath: 'GENERAL_CONFIG.COMPANY_INFO.LEGAL_FORM',
      dataTable: true,

      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'capital',
      label: 'Capital',
      labelTranslatePath: 'GENERAL_CONFIG.COMPANY_INFO.CAPITAL',
      attributeType: AttributeType.number,
      dataTable: true,

      fieldType: FieldType.number,
      sortable: true,
      filterable: true
    },
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'GENERAL_CONFIG.CONTACT_INFO.EMAIL',
      dataTable: true,

      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'phone',
      label: 'Phone',
      labelTranslatePath: 'GENERAL_CONFIG.CONTACT_INFO.PHONE',
      dataTable: true,

      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    },
    {
      name: 'city',
      label: 'City',
      labelTranslatePath: 'GENERAL_CONFIG.ADDRESS_INFO.CITY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      dataTable: true,

      sortable: true,
      filterable: true
    },
    {
      name: 'governorate',
      label: 'Governorate',
      labelTranslatePath: 'GENERAL_CONFIG.ADDRESS_INFO.GOVERNORATE',
      attributeType: AttributeType.string,
      dataTable: true,

      fieldType: FieldType.text,
      sortable: true,
      filterable: true
    }
  ]
};

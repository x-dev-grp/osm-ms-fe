import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'badge',
  title: 'Liste des employés',
  titleTranslatePath: 'AUTO.LISTE_DES_EMPLOYES',
  baseURL: 'hr/employee',
  searchEndpoint: 'hr/employee',
  addNewItem: true,
  addNewItemUrl: 'hr/employee/new',
  fileName: 'employees',

  defaultSearchData: {
    page: 0,
    size: 10,
    sort: 'createdDate',
    order: 'DESC',
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: { equalValue: false }
      }
    }
  },

  fields: [
    // Identité
    {
      name: 'firstName',
      label: 'Prénom',
      labelTranslatePath: 'EMPLOYEE.FIRST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true,
      exportLabel: 'firstName'
    },
    {
      name: 'lastName',
      label: 'Nom',
      labelTranslatePath: 'EMPLOYEE.LAST_NAME',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: true,
      dataTable: true,
      exportable: true
    },
    {
      name: 'cin',
      label: 'CIN',
      labelTranslatePath: 'EMPLOYEE.CIN',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },

    // Coordonnées
    {
      name: 'email',
      label: 'Email',
      labelTranslatePath: 'EMPLOYEE.EMAIL',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'phone',
      label: 'Téléphone',
      labelTranslatePath: 'EMPLOYEE.PHONE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },

    // Adresse
    {
      name: 'country',
      label: 'Pays',
      labelTranslatePath: 'EMPLOYEE.COUNTRY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'city',
      label: 'Ville',
      labelTranslatePath: 'EMPLOYEE.CITY',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'postalCode',
      label: 'Code postal',
      labelTranslatePath: 'EMPLOYEE.POSTAL_CODE',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: false, // pour alléger la table
      exportable: true
    },
    {
      name: 'address',
      label: 'Adresse',
      labelTranslatePath: 'EMPLOYEE.ADDRESS',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: false,
      filterable: true,
      defaultFilter: false,
      dataTable: false, // champ long -> export oui, table non
      exportable: true
    },

    // Dates
    {
      name: 'hireDate',
      label: "Date d'embauche",
      labelTranslatePath: 'EMPLOYEE.HIRE_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'birthDate',
      label: 'Date de naissance',
      labelTranslatePath: 'EMPLOYEE.BIRTH_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: false,
      exportable: true
    },

    // Enums & statut
    {
      name: 'gender',
      label: 'Genre',
      labelTranslatePath: 'EMPLOYEE.FORM.GENDER',
      attributeType: AttributeType.enum, // ou AttributeType.enum si dispo
      fieldType: FieldType.select, // select si ton module le gère
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [
        { value: 'MALE', label: 'MALE', labelTranslatePath: 'AUTO.MALE' },
        { value: 'FEMALE', label: 'FEMALE', labelTranslatePath: 'AUTO.FEMALE' }
      ]
    },

    {
      name: 'maritalStatus',
      label: 'Situation familiale',
      labelTranslatePath: 'EMPLOYEE.FORM.MARITAL_STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [
        { value: 'SINGLE', label: 'SINGLE', labelTranslatePath: 'AUTO.SINGLE' },
        { value: 'MARRIED', label: 'MARRIED', labelTranslatePath: 'AUTO.MARRIED' },
        { value: 'WIDOWED', label: 'WIDOWED', labelTranslatePath: 'AUTO.WIDOWED' },
        { value: 'DIVORCED', label: 'DIVORCED', labelTranslatePath: 'AUTO.DIVORCED' }
      ]
    },
    {
      name: 'active',
      label: 'Actif',
      labelTranslatePath: 'EMPLOYEE.IS_ACTIVE',
      attributeType: AttributeType.boolean,
      fieldType: FieldType.checkbox,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },

    // Relation (affichage du nom du département)
    {
      name: 'department.name',
      label: 'Département',
      labelTranslatePath: 'EMPLOYEE.DEPARTMENT',
      attributeType: AttributeType.string,
      fieldType: FieldType.text,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    }
  ]
};

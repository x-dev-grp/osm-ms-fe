import { AttributeType, DashboardConfig, FieldType } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../../shared/models/advanced-search/searchOperation';

export const dashboardConfig: DashboardConfig = {
  icon: 'badge',
  title: 'Liste des employés',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.FIRST_NAME',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.LAST_NAME',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.CIN',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.EMAIL',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.PHONE',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.COUNTRY',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.CITY',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.POSTAL_CODE',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.ADDRESS',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.HIRE_DATE',
      attributeType: AttributeType.date, // si non supporté: AttributeType.string
      fieldType: FieldType.date, // si non supporté: FieldType.text
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true
    },
    {
      name: 'birthDate',
      label: 'Date de naissance',
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.BIRTH_DATE',
      attributeType: AttributeType.date,
      fieldType: FieldType.date,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: false, // évite de surcharger la grille
      exportable: true
    },

    // Enums & statut
    {
      name: 'gender',
      label: 'Genre',
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.GENDER',
      attributeType: AttributeType.enum, // ou AttributeType.enum si dispo
      fieldType: FieldType.select, // select si ton module le gère
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [
        { value: 'MALE', label: 'MALE' },
        { value: 'FEMALE', label: 'FEMALE' }
      ]
    },

    {
      name: 'maritalStatus',
      label: 'Situation familiale',
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.MARITAL_STATUS',
      attributeType: AttributeType.enum,
      fieldType: FieldType.select,
      sortable: true,
      filterable: true,
      defaultFilter: false,
      dataTable: true,
      exportable: true,
      options: [
        { value: 'SINGLE', label: 'SINGLE' },
        { value: 'MARRIED', label: 'MARRIED' },
        { value: 'WIDOWED', label: 'WIDOWED' },
        { value: 'DIVORCED', label: 'DIVORCED' }
      ]
    },
    {
      name: 'active',
      label: 'Actif',
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.IS_ACTIVE',
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
      labelTranslatePath: 'EMPLOYEE.DASHBOARD.FIELDS.DEPARTMENT',
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

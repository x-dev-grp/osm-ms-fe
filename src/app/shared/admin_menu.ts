import { Navigation } from 'src/app/theme/types/navigation';
import { Role } from 'src/app/theme/types/role';

export const admin_menus: Navigation[] = [
  {
    id: 'oosmAdminGroup',
    title: 'MENU.ADMINISTRATION.TITLE',
    type: 'group',
    role: [Role.OosmAdmin],
    children: [
      {
        id: 'adminDashboard',
        title: 'MENU.ADMINISTRATION.DASHBOARD',
        type: 'item',
        url: '/administration/dashboard',
        icon: 'admin_panel_settings',
        breadcrumbs: false
      },
      {
        id: 'adminCompanies',
        title: 'MENU.ADMINISTRATION.COMPANY_PROFILES',
        type: 'item',
        url: '/administration/companies',
        icon: 'business',
        breadcrumbs: false
      },
      {
        id: 'adminUsers',
        title: 'MENU.ADMINISTRATION.USERS',
        type: 'item',
        url: '/administration/users',
        icon: 'manage_accounts',
        breadcrumbs: false
      },
      {
        id: 'adminSupport',
        title: 'MENU.ADMINISTRATION.SUPPORT',
        type: 'item',
        url: '/administration/support',
        icon: 'support_agent',
        breadcrumbs: false
      },
      {
        id: 'adminPermissionCatalog',
        title: 'MENU.ADMINISTRATION.PERMISSION_CATALOG',
        type: 'item',
        url: '/administration/permission-catalog',
        icon: 'security',
        breadcrumbs: false
      },
      {
        id: 'adminSettings',
        title: 'MENU.ADMINISTRATION.SETTINGS',
        type: 'item',
        url: '/administration/settings',
        icon: 'tune',
        breadcrumbs: false
      },
      {
        id: 'adminApiDocs',
        title: 'MENU.ADMINISTRATION.API_DOCS',
        type: 'item',
        url: '/administration/api-docs',
        icon: 'api',
        breadcrumbs: false
      },
      {
        id: 'addOosmAdmin',
        title: 'MENU.ADMINISTRATION.ADD_OOSM_ADMIN',
        type: 'item',
        url: '/administration/osm-admins/add',
        icon: 'admin_panel_settings',
        breadcrumbs: false
      }
    ]
  }
];

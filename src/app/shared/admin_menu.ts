import { Navigation } from 'src/app/@theme/types/navigation';
import { Role } from 'src/app/@theme/types/role';

export const admin_menus: Navigation[] = [
  {
    id: 'osmAdminGroup',
    title: 'MENU.ADMINISTRATION.TITLE',
    type: 'group',
    role: [Role.OsmAdmin],
    children: [
      {
        id: 'adminDashboard',
        title: 'MENU.ADMINISTRATION.DASHBOARD',
        type: 'item',
        url: '/administration/dashboard',
        icon: 'admin_panel_settings',
        breadcrumbs: false
      }
    ]
  }
];

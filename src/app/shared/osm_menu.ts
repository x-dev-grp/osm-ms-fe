// type
import { Navigation } from 'src/app/@theme/types/navigation';
import { Role } from 'src/app/@theme/types/role';

export const osm_menus: Navigation[] = [
  {
    id: 'navigation',
    title: 'Home',
    type: 'group',
    icon: 'icon-navigation',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'collapse',
        icon: '#custom-status-up',
        role: [Role.Admin, Role.User],
        children: [
          {
            id: 'default',
            title: 'Default',
            type: 'item',
            url: '/dashboard',
            breadcrumbs: false
          },
          {
            id: 'analytics',
            title: 'Analytics',
            type: 'item',
            url: '/dashboard/analytics',
            role: [Role.Admin]
          },
          {
            id: 'finance',
            title: 'Finance',
            type: 'item',
            url: '/dashboard/finance',
            role: [Role.Admin]
          }
        ]
      },
      // {
      //   id: 'Delevery',
      //   title: 'Delivery',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: '/delivery',
      //   icon: '#custom-shopping-bag',
      //   role: [Role.Admin, Role.User]
      // },
      // {
      //   id: 'supplier',
      //   title: 'Supplier',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: '/supplier',
      //   icon: '#custom-user',
      //   role: [Role.Admin, Role.User]
      // },
      {
        id: 'millers',
        title: 'Millers',
        type: 'item',
        classes: 'nav-item',
        url: '/millers',
        icon: '#custom-cpu-charge',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'planning',
        title: 'Planning',
        type: 'item',
        classes: 'nav-item',
        url: '/planning',
        icon: '#custom-kanban',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'storage',
        title: 'Storage',
        type: 'item',
        classes: 'nav-item',
        url: '/storage',
        icon: '#custom-layer',
        role: [Role.Admin, Role.User]
      }
    ]
  },
  // {
  //   id: 'pages',
  //   title: 'Pages',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   role: [Role.Admin, Role.User],
  //   children: [
  //     {
  //       id: 'maintenance',
  //       title: 'Maintenance',
  //       type: 'collapse',
  //       icon: '#custom-flag',
  //       role: [Role.Admin, Role.User],
  //       children: [
  //         {
  //           id: 'error',
  //           title: 'Error 404',
  //           type: 'item',
  //           url: '/maintenance/error-404',
  //           target: true,
  //           breadcrumbs: false
  //         },
  //         {
  //           id: 'error-500',
  //           title: 'Error 500',
  //           type: 'item',
  //           url: '/maintenance/error-500',
  //           target: true,
  //           breadcrumbs: false
  //         },
  //         {
  //           id: 'under-constructor',
  //           title: 'Under Construction',
  //           type: 'item',
  //           url: '/maintenance/under-constructor',
  //           target: true,
  //           breadcrumbs: false
  //         },
  //         {
  //           id: 'coming-soon',
  //           title: 'Coming Soon',
  //           type: 'item',
  //           url: '/maintenance/coming-soon',
  //           target: true,
  //           breadcrumbs: false
  //         }
  //       ]
  //     },
  //     {
  //       id: 'contact-us',
  //       title: 'Contact Us',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/contact-us',
  //       icon: '#custom-24-support',
  //       role: [Role.Admin, Role.User],
  //       target: true,
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'price',
  //       title: 'Price',
  //       type: 'collapse',
  //       icon: '#custom-dollar-square',
  //       role: [Role.Admin, Role.User],
  //       children: [
  //         {
  //           id: 'price-1',
  //           title: 'Price 1',
  //           type: 'item',
  //           url: '/price/price-1'
  //         },
  //         {
  //           id: 'price-2',
  //           title: 'Price 2',
  //           type: 'item',
  //           url: '/price/price-2'
  //         }
  //       ]
  //     },
  //     {
  //       id: 'landing',
  //       title: 'Landing',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/landing',
  //       icon: '#custom-airplane',
  //       role: [Role.Admin, Role.User],
  //       target: true,
  //       breadcrumbs: false
  //     }
  //   ]
  // },

  {
    id: 'receptionGlobale',
    title: 'Réception',
    type: 'group',
    icon: 'icon-navigation',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'bonRecepetion',
        title: 'Bon Réception',
        type: 'item',
        classes: 'nav-item',
        url: '/reception/bonreception',
        icon: '#custom-document-text'
      },
      {
        id: 'recepetion',
        title: 'Réception',
        type: 'item',
        classes: 'nav-item',
        url: '/reception',
        icon: '#custom-document-text'
      },
      {
        id: 'qcrReception',
        title: 'Contrôle Qualité',
        type: 'item',
        classes: 'nav-item',
        url: '/reception/quality',
        icon: '#custom-password-check'
      },
      {
        id: 'fournisseurReception',
        title: 'Fournisseurs',
        type: 'item',
        classes: 'nav-item',
        url: '/reception/fournisseur',
        icon: '#custom-user'
      }
    ]
  },
  {
    id: 'settingsGroup',
    title: 'Settings',
    type: 'collapse',
    icon: '#custom-setting-2',
    role: [Role.Admin, Role.User],
    children: [
      {
        id: 'generalConfig',
        title: 'General Configuration',
        type: 'item',
        url: '/settings/general-config',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'qualityControl',
        title: 'Quality Control Rules',
        type: 'item',
        url: '/settings/quality-control',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'storageSettings',
        title: 'Storage & Oil Units',
        type: 'item',
        url: '/settings/storage',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'pricingSettings',
        title: 'Pricing & Accounting',
        type: 'item',
        url: '/settings/pricing',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'banks',
        title: 'Banks managment',
        type: 'item',
        url: '/settings/banks',
        role: [Role.Admin, Role.User]
      },
      {
        id: 'genericTypes',
        title: 'Generic Types',
        type: 'item',
        url: '/settings/generic',
        role: [Role.Admin, Role.User]
      }
    ]
  }
];

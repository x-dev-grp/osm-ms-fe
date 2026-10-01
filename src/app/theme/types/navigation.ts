export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  link?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  role?: string[];
  disabled?: boolean;
  isMainParent?: boolean;

  children?: Navigation[];
  /** Tenant module(s) gating the entry; with several, any enabled module is enough. */
  modulePermission?: string | string[];
  ressourcePermission?: string;
  permissions?: string[];
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}

export interface AdminRoleCount {
  roleName: string;
  count: number;
}

export interface AdminTenantSummary {
  tenantId?: string;
  tenantName?: string;
  userCount: number;
  active?: boolean;
  createdDate?: string;
}

export interface AdminUserSummary {
  id?: string;
  username?: string;
  email?: string;
  roleName?: string;
  tenantName?: string;
  locked?: boolean;
  createdDate?: string;
}

export interface AdminCompanyOverview {
  tenantId: string;
  tenantName?: string;
  city?: string | null;
  active: boolean;
  userCount: number;
  activeUsersLast7Days: number;
  enabledModules: string[];
  createdDate?: string | null;
  lastActivityAt?: string | null;
}

export interface AdminModuleAdoption {
  module: string;
  tenantCount: number;
}

export interface AdminSupportSummary {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  usersWithoutTenant: number;
  newUsersLast30Days: number;
  usersByRole: AdminRoleCount[];
  topTenantsByUsers: AdminTenantSummary[];
  recentTenants: AdminTenantSummary[];
  recentUsers: AdminUserSummary[];
  activeUsersLast7Days?: number;
  companies?: AdminCompanyOverview[];
  moduleAdoption?: AdminModuleAdoption[];
  supportTickets?: AdminSupportSummary;
}

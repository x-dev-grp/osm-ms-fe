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
}

import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SharedModule } from 'src/app/shared/shared.module';

import { AdminDashboardService } from '../services/admin-dashboard.service';

import { AdminCompanyOverview, AdminDashboardStats } from '../models/admin-dashboard-stats.model';

import { AdminSettingsService } from '../admin-settings/services/admin-settings.service';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { SystemHealthComponent } from '../../shared/components/system-health/system-health.component';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { createKpiSheet, DashboardExportPayload } from '../../shared/components/dashboard/dashboard-export.models';
import { SupportTicketService } from '../../shared/services/support-ticket.service';
import { SupportTicket } from '../../shared/models/support-ticket.model';
import { TENANT_MODULE_OPTIONS } from '../../shared/constants/tenant-modules.constants';

type CompanyStatusFilter = 'all' | 'active' | 'inactive';

interface AttentionItem {
  icon: string;
  labelKey: string;
  count: number;
  link: string;
  tone: 'warn' | 'danger' | 'info';
}

interface ModuleAdoptionRow {
  module: string;
  labelKey: string;
  icon: string;
  tenantCount: number;
  percent: number;
}

const MODULE_ICONS: Record<string, string> = {
  HR: 'groups',
  RECEPTION: 'spa',
  PRODUCTION: 'water_drop',
  FINANCE: 'account_balance',
  INVENTAIR: 'inventory_2',
  CONDITIONING: 'local_shipping',
  HABILITATION: 'verified_user'
};

const INACTIVITY_DAYS = 30;
const COMPANY_PREVIEW_LIMIT = 8;
const RECENT_TICKETS_LIMIT = 5;

@Component({
  selector: 'app-administration-dashboard',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    DatePipe,
    DashboardShellComponent,
    SystemHealthComponent
  ],

  templateUrl: './administration-dashboard.component.html',

  styleUrls: ['./administration-dashboard.component.scss']
})
export class AdministrationDashboardComponent implements OnInit {
  private readonly adminDashboardService = inject(AdminDashboardService);
  private readonly adminSettingsService = inject(AdminSettingsService);
  private readonly supportTicketService = inject(SupportTicketService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly showSystemHealth = inject(AuthenticationService).isOosmAdmin();

  readonly companyPreviewLimit = COMPANY_PREVIEW_LIMIT;

  readonly companyStatuses: CompanyStatusFilter[] = ['all', 'active', 'inactive'];

  stats: AdminDashboardStats | null = null;

  recentTickets: SupportTicket[] = [];

  loading = false;

  loadError = false;

  swaggerEnabled = false;

  lastUpdated: Date | null = null;

  companySearch = '';

  companyStatus: CompanyStatusFilter = 'all';

  showAllCompanies = false;

  attentionItems: AttentionItem[] = [];

  moduleAdoption: ModuleAdoptionRow[] = [];

  private readonly moduleLabels = new Map(TENANT_MODULE_OPTIONS.map((option) => [option.value as string, option.labelKey]));

  ngOnInit(): void {
    this.adminSettingsService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.swaggerEnabled = status.features?.['swagger']?.enabled ?? false;
        }
      });

    this.refresh();
  }

  refresh(): void {
    this.loading = true;

    this.loadError = false;

    this.adminDashboardService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.attentionItems = this.buildAttentionItems(stats);
          this.moduleAdoption = this.buildModuleAdoption(stats);
          this.lastUpdated = new Date();
          this.loading = false;
        },

        error: () => {
          this.loading = false;

          this.loadError = true;
        }
      });

    this.supportTicketService
      .list(0, RECENT_TICKETS_LIMIT, 'all')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.recentTickets = response.data ?? [];
      });
  }

  get hasActivityData(): boolean {
    return this.stats?.activeUsersLast7Days !== undefined;
  }

  get openTickets(): number {
    const support = this.stats?.supportTickets;
    return support ? support.open + support.inProgress : 0;
  }

  get supportTotal(): number {
    const support = this.stats?.supportTickets;
    return support ? support.open + support.inProgress + support.resolved + support.closed : 0;
  }

  get filteredCompanies(): AdminCompanyOverview[] {
    const query = this.companySearch.trim().toLowerCase();
    return (this.stats?.companies ?? []).filter((company) => {
      if (this.companyStatus === 'active' && !company.active) {
        return false;
      }
      if (this.companyStatus === 'inactive' && company.active) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${company.tenantName ?? ''} ${company.city ?? ''}`.toLowerCase().includes(query);
    });
  }

  get visibleCompanies(): AdminCompanyOverview[] {
    const companies = this.filteredCompanies;
    return this.showAllCompanies ? companies : companies.slice(0, COMPANY_PREVIEW_LIMIT);
  }

  setCompanyStatus(status: CompanyStatusFilter): void {
    this.companyStatus = status;
    this.showAllCompanies = false;
  }

  moduleLabelKey(module: string): string {
    return this.moduleLabels.get(module) ?? module;
  }

  moduleIcon(module: string): string {
    return MODULE_ICONS[module] ?? 'extension';
  }

  isStale(company: AdminCompanyOverview): boolean {
    if (!company.lastActivityAt) {
      return true;
    }
    return Date.now() - new Date(company.lastActivityAt).getTime() > INACTIVITY_DAYS * 86_400_000;
  }

  openCompany(company: AdminCompanyOverview): void {
    void this.router.navigate(['/administration/companies', company.tenantId, 'view']);
  }

  manageModules(company: AdminCompanyOverview): void {
    void this.router.navigate(['/administration/companies', company.tenantId, 'view'], {
      queryParams: { focus: 'modules' }
    });
  }

  percentOf(value: number, total: number): number {
    return total ? Math.round((value / total) * 100) : 0;
  }

  get exportPayload(): DashboardExportPayload | null {
    if (!this.stats) {
      return null;
    }

    const t = (key: string) => this.translate.instant(key);
    const yesNo = (value: boolean) => t(value ? 'ADMIN_DASHBOARD.STATUS.ACTIVE' : 'ADMIN_DASHBOARD.STATUS.INACTIVE');

    return {
      fileName: 'admin-dashboard',
      title: t('ADMIN_DASHBOARD.TITLE'),
      sheets: [
        createKpiSheet(t('ADMIN_DASHBOARD.EXPORT.KPIS'), [
          { label: t('ADMIN_DASHBOARD.KPIS.TOTAL_TENANTS'), value: this.stats.totalTenants },
          { label: t('ADMIN_DASHBOARD.KPIS.ACTIVE_TENANTS'), value: this.stats.activeTenants },
          { label: t('ADMIN_DASHBOARD.KPIS.INACTIVE_TENANTS'), value: this.stats.inactiveTenants },
          { label: t('ADMIN_DASHBOARD.KPIS.TOTAL_USERS'), value: this.stats.totalUsers },
          { label: t('ADMIN_DASHBOARD.KPIS.ACTIVE_USERS_7D'), value: this.stats.activeUsersLast7Days ?? '-' },
          { label: t('ADMIN_DASHBOARD.KPIS.NEW_USERS_30D'), value: this.stats.newUsersLast30Days },
          { label: t('ADMIN_DASHBOARD.KPIS.LOCKED_USERS'), value: this.stats.lockedUsers },
          { label: t('ADMIN_DASHBOARD.KPIS.USERS_WITHOUT_TENANT'), value: this.stats.usersWithoutTenant },
          { label: t('ADMIN_DASHBOARD.KPIS.OPEN_TICKETS'), value: this.openTickets }
        ]),
        {
          name: t('ADMIN_DASHBOARD.SECTIONS.COMPANIES'),
          columns: [
            { key: 'company', label: t('ADMIN_DASHBOARD.TABLE.COMPANY') },
            { key: 'status', label: t('ADMIN_DASHBOARD.TABLE.STATUS') },
            { key: 'modules', label: t('ADMIN_DASHBOARD.TABLE.MODULES') },
            { key: 'users', label: t('ADMIN_DASHBOARD.TABLE.USERS') },
            { key: 'active', label: t('ADMIN_DASHBOARD.TABLE.ACTIVE_7D') },
            { key: 'created', label: t('ADMIN_DASHBOARD.TABLE.CREATED') },
            { key: 'lastActivity', label: t('ADMIN_DASHBOARD.TABLE.LAST_ACTIVITY') }
          ],
          rows: (this.stats.companies ?? []).map((company) => ({
            company: company.tenantName || '-',
            status: yesNo(company.active),
            modules: company.enabledModules.map((module) => t(this.moduleLabelKey(module))).join(', '),
            users: company.userCount,
            active: company.activeUsersLast7Days,
            created: company.createdDate ? new Date(company.createdDate).toLocaleDateString() : '-',
            lastActivity: company.lastActivityAt ? new Date(company.lastActivityAt).toLocaleString() : '-'
          }))
        },
        {
          name: t('ADMIN_DASHBOARD.SECTIONS.MODULE_ADOPTION'),
          columns: [
            { key: 'module', label: t('ADMIN_DASHBOARD.TABLE.MODULE') },
            { key: 'tenants', label: t('ADMIN_DASHBOARD.TABLE.COMPANIES') },
            { key: 'percent', label: '%' }
          ],
          rows: this.moduleAdoption.map((row) => ({
            module: t(row.labelKey),
            tenants: row.tenantCount,
            percent: row.percent
          }))
        },
        {
          name: t('ADMIN_DASHBOARD.SECTIONS.RECENT_USERS'),
          columns: [
            { key: 'username', label: t('ADMIN_USERS.FIELDS.USERNAME') },
            { key: 'email', label: 'Email' },
            { key: 'role', label: t('ADMIN_USERS.FIELDS.ROLE') },
            { key: 'tenant', label: t('ADMIN_USERS.FIELDS.TENANT') }
          ],
          rows: (this.stats.recentUsers ?? []).map((user) => ({
            username: user.username,
            email: user.email,
            role: user.roleName,
            tenant: user.tenantName
          }))
        }
      ].filter((sheet) => sheet.rows.length > 0)
    };
  }

  private buildAttentionItems(stats: AdminDashboardStats): AttentionItem[] {
    const companies = stats.companies ?? [];
    const items: AttentionItem[] = [
      {
        icon: 'support_agent',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.OPEN_TICKETS',
        count: stats.supportTickets?.open ?? 0,
        link: '/administration/support',
        tone: 'danger'
      },
      {
        icon: 'pause_circle',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.INACTIVE_COMPANIES',
        count: stats.inactiveTenants,
        link: '/administration/companies',
        tone: 'warn'
      },
      {
        icon: 'group_off',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.COMPANIES_WITHOUT_USERS',
        count: companies.filter((company) => company.userCount === 0).length,
        link: '/administration/companies',
        tone: 'warn'
      },
      {
        icon: 'extension_off',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.COMPANIES_WITHOUT_MODULES',
        count: companies.filter((company) => !company.enabledModules.length).length,
        link: '/administration/companies',
        tone: 'warn'
      },
      {
        icon: 'bedtime',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.DORMANT_COMPANIES',
        count: stats.activeUsersLast7Days === undefined ? 0 : companies.filter((company) => company.active && this.isStale(company)).length,
        link: '/administration/companies',
        tone: 'info'
      },
      {
        icon: 'lock',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.LOCKED_USERS',
        count: stats.lockedUsers,
        link: '/administration/users',
        tone: 'info'
      },
      {
        icon: 'person_off',
        labelKey: 'ADMIN_DASHBOARD.ATTENTION.USERS_WITHOUT_TENANT',
        count: stats.usersWithoutTenant,
        link: '/administration/users',
        tone: 'info'
      }
    ];
    return items.filter((item) => item.count > 0);
  }

  private buildModuleAdoption(stats: AdminDashboardStats): ModuleAdoptionRow[] {
    const total = stats.companies?.length || stats.totalTenants;
    return (stats.moduleAdoption ?? [])
      .map((row) => ({
        module: row.module,
        labelKey: this.moduleLabelKey(row.module),
        icon: this.moduleIcon(row.module),
        tenantCount: row.tenantCount,
        percent: this.percentOf(row.tenantCount, total)
      }))
      .sort((left, right) => right.tenantCount - left.tenantCount);
  }
}

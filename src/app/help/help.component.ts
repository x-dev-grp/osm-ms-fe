import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService } from '../auth/services/authentication.service';
import { SupportTicketService } from '../shared/services/support-ticket.service';
import { SupportTicket, SupportTicketScope } from '../shared/models/support-ticket.model';
import { SupportTicketDetailDialogComponent } from '../shared/components/support-ticket-detail-dialog/support-ticket-detail-dialog.component';
import { Role } from '../theme/types/role';
import {
  Action,
  ConditioningEntity,
  FinanceEntity,
  HREntity,
  InventoryEntity,
  OOSMModule,
  permissionKey,
  ProductionEntity,
  ReceptionEntity
} from '../theme/types/permissions';
import {
  HelpCommonTask,
  HelpFaqItem,
  HelpFlowStep,
  HelpHrGuideLink,
  HelpModuleLink,
  HelpModuleTask,
  HelpNavItem,
  HelpPdfGuide
} from './help.models';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule,
    TranslateModule
  ],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  private auth = inject(AuthenticationService);
  private supportTicketService = inject(SupportTicketService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  myTickets: SupportTicket[] = [];
  ticketsLoading = false;
  ticketScope: SupportTicketScope = 'mine';

  modules: HelpModuleLink[] = [];
  moduleTasks: Record<string, HelpModuleTask[]> = {};
  commonTasks: HelpCommonTask[] = [];
  navItems: HelpNavItem[] = [];

  private readonly baseNavItems: HelpNavItem[] = [
    { id: 'help-start', labelKey: 'USER_GUIDE.NAV.START' },
    { id: 'help-flow', labelKey: 'USER_GUIDE.NAV.FLOW' },
    { id: 'help-modules', labelKey: 'USER_GUIDE.NAV.MODULES' },
    { id: 'help-tasks', labelKey: 'USER_GUIDE.NAV.TASKS' },
    { id: 'help-workflows', labelKey: 'USER_GUIDE.NAV.WORKFLOWS' },
    { id: 'help-faq', labelKey: 'USER_GUIDE.NAV.FAQ' },
    { id: 'help-support', labelKey: 'USER_GUIDE.NAV.SUPPORT' },
    { id: 'help-pdf', labelKey: 'USER_GUIDE.NAV.PDF' },
    { id: 'help-tips', labelKey: 'USER_GUIDE.NAV.TIPS' }
  ];

  readonly hrAchievementKeys: string[] = [
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.ENTITIES',
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.PROFILE',
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.RULES',
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.PAYROLL',
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.LEAVE',
    'USER_GUIDE.HR.GUIDE.ACHIEVEMENTS.PERMISSIONS'
  ];

  readonly hrPermissionEntityKeys: string[] = [
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.POSTE',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.EMPLOYEE',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.CONTRACT',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.POINTAGE',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.LEAVE',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.PAYROLL_PERIOD',
    'USER_GUIDE.HR.GUIDE.PERMISSIONS.PAYSLIP'
  ];

  readonly hrRolePresetKeys: string[] = [
    'USER_GUIDE.HR.GUIDE.ROLES.CLERK',
    'USER_GUIDE.HR.GUIDE.ROLES.MANAGER',
    'USER_GUIDE.HR.GUIDE.ROLES.PAYROLL',
    'USER_GUIDE.HR.GUIDE.ROLES.ADMIN'
  ];

  readonly hrWorkflowKeys: string[] = [
    'USER_GUIDE.HR.GUIDE.WORKFLOW.STEP1',
    'USER_GUIDE.HR.GUIDE.WORKFLOW.STEP2',
    'USER_GUIDE.HR.GUIDE.WORKFLOW.STEP3',
    'USER_GUIDE.HR.GUIDE.WORKFLOW.STEP4',
    'USER_GUIDE.HR.GUIDE.WORKFLOW.STEP5'
  ];

  readonly hrGuideLinks: HelpHrGuideLink[] = [
    { labelKey: 'USER_GUIDE.HR.LINKS.DASHBOARD', route: '/hr', icon: 'dashboard' },
    { labelKey: 'USER_GUIDE.HR.LINKS.EMPLOYEES', route: '/hr/employees', icon: 'groups' },
    { labelKey: 'USER_GUIDE.HR.LINKS.POSTES', route: '/hr/postes', icon: 'work' },
    { labelKey: 'USER_GUIDE.HR.LINKS.CONTRACTS', route: '/hr/contracts', icon: 'description' },
    { labelKey: 'USER_GUIDE.HR.LINKS.POINTAGE', route: '/hr/pointages', icon: 'schedule' },
    { labelKey: 'USER_GUIDE.HR.LINKS.LEAVE', route: '/hr/leave-requests', icon: 'event_busy' },
    { labelKey: 'USER_GUIDE.HR.LINKS.PAYROLL', route: '/hr/payroll-periods', icon: 'calendar_month' },
    { labelKey: 'USER_GUIDE.HR.LINKS.PAYSLIPS', route: '/hr/payslips', icon: 'receipt_long' }
  ];

  readonly pdfGuides: HelpPdfGuide[] = [
    {
      id: 'fr',
      langKey: 'fr',
      titleKey: 'USER_GUIDE.PDF_GUIDES.FR.TITLE',
      descKey: 'USER_GUIDE.PDF_GUIDES.FR.DESC',
      fileName: 'OOSM-Guide-Utilisateur-FR.pdf',
      flag: '🇫🇷'
    },
    {
      id: 'en',
      langKey: 'en',
      titleKey: 'USER_GUIDE.PDF_GUIDES.EN.TITLE',
      descKey: 'USER_GUIDE.PDF_GUIDES.EN.DESC',
      fileName: 'OOSM-User-Guide-EN.pdf',
      flag: '🇬🇧'
    },
    {
      id: 'ar',
      langKey: 'ar',
      titleKey: 'USER_GUIDE.PDF_GUIDES.AR.TITLE',
      descKey: 'USER_GUIDE.PDF_GUIDES.AR.DESC',
      fileName: 'OOSM-User-Guide-AR.pdf',
      flag: '🇸🇦'
    }
  ];

  readonly flowSteps: HelpFlowStep[] = [
    { labelKey: 'USER_GUIDE.FLOW.RECEPTION', icon: 'spa' },
    { labelKey: 'USER_GUIDE.FLOW.STORAGE', icon: 'water_drop' },
    { labelKey: 'USER_GUIDE.FLOW.CONDITIONING', icon: 'precision_manufacturing' },
    { labelKey: 'USER_GUIDE.FLOW.FINANCE', icon: 'account_balance_wallet' }
  ];

  readonly faqItems: HelpFaqItem[] = [
    { questionKey: 'USER_GUIDE.FAQ.MISSING_MENU.Q', answerKey: 'USER_GUIDE.FAQ.MISSING_MENU.A' },
    { questionKey: 'USER_GUIDE.FAQ.LOGIN.Q', answerKey: 'USER_GUIDE.FAQ.LOGIN.A' },
    { questionKey: 'USER_GUIDE.FAQ.PDF.Q', answerKey: 'USER_GUIDE.FAQ.PDF.A' },
    { questionKey: 'USER_GUIDE.FAQ.PASSWORD.Q', answerKey: 'USER_GUIDE.FAQ.PASSWORD.A' },
    { questionKey: 'USER_GUIDE.FAQ.LANGUAGE.Q', answerKey: 'USER_GUIDE.FAQ.LANGUAGE.A' },
    { questionKey: 'USER_GUIDE.FAQ.OIL_SALE.Q', answerKey: 'USER_GUIDE.FAQ.OIL_SALE.A' },
    { questionKey: 'USER_GUIDE.FAQ.HR_PAYROLL.Q', answerKey: 'USER_GUIDE.FAQ.HR_PAYROLL.A' },
    { questionKey: 'USER_GUIDE.FAQ.HR_LEAVE.Q', answerKey: 'USER_GUIDE.FAQ.HR_LEAVE.A' }
  ];

  readonly receptionTypes = [
    { labelKey: 'OPERATION_TYPE.EXCHANGE', route: '/reception/reception-olive/exchange' },
    { labelKey: 'OPERATION_TYPE.SIMPLE_RECEPTION', route: '/reception/reception-olive/simple_reception' },
    { labelKey: 'OPERATION_TYPE.BASE', route: '/reception/reception-olive/base' },
    { labelKey: 'OPERATION_TYPE.OLIVE_PURCHASE', route: '/reception/reception-olive/olive_purchase' }
  ];

  get userDisplayName(): string {
    const user = this.auth.currentUserValue;
    if (!user) {
      return '';
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.username || user.email || '';
  }

  get roleLabelKey(): string | null {
    const role = this.auth.currentUserValue?.role;
    if (!role) {
      return null;
    }
    const upper = String(role).toUpperCase();
    if (upper === 'OOSMADMIN') {
      return 'USER_GUIDE.ROLE.OOSMADMIN';
    }
    if (upper === 'ADMIN') {
      return 'USER_GUIDE.ROLE.ADMIN';
    }
    return 'USER_GUIDE.ROLE.USER';
  }

  get visibleReceptionTypes(): typeof this.receptionTypes {
    if (!this.canAccessReception()) {
      return [];
    }
    return this.receptionTypes;
  }

  ngOnInit(): void {
    this.navItems = [...this.baseNavItems];
    if (this.canAccessHr()) {
      const modulesIndex = this.navItems.findIndex((item) => item.id === 'help-modules');
      this.navItems.splice(modulesIndex + 1, 0, { id: 'help-hr', labelKey: 'USER_GUIDE.HR.NAV' });
    }
    this.modules = this.buildVisibleModules();
    this.moduleTasks = this.buildModuleTasks();
    this.commonTasks = this.buildCommonTasks();
    this.loadTickets();
  }

  get canManageCompanyTickets(): boolean {
    const role = this.auth.currentUserValue?.role;
    return role === Role.Admin || role === Role.OosmAdmin;
  }

  openSupportTicket(): void {
    this.supportTicketService.openCreateDialog();
  }

  setTicketScope(scope: SupportTicketScope): void {
    this.ticketScope = scope;
    this.loadTickets();
  }

  viewTicket(ticket: SupportTicket): void {
    this.dialog.open(SupportTicketDetailDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: {
        ticket,
        canManage: this.canManageCompanyTickets && this.ticketScope === 'tenant'
      }
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      if (updated) {
        this.loadTickets();
      }
    });
  }

  private loadTickets(): void {
    this.ticketsLoading = true;
    this.supportTicketService
      .list(0, 10, this.ticketScope)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.myTickets = response.data ?? [];
          this.ticketsLoading = false;
        },
        error: () => {
          this.myTickets = [];
          this.ticketsLoading = false;
        }
      });
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  pdfAssetUrl(fileName: string): string {
    return `assets/user-guide/${fileName}`;
  }

  tasksForModule(moduleId: string): HelpModuleTask[] {
    return this.moduleTasks[moduleId] ?? [];
  }

  canAccessHr(): boolean {
    return (
      this.auth.hasModule(OOSMModule.HR) &&
      this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.READ))
    );
  }

  private canAccessReception(): boolean {
    return (
      this.auth.hasModule(OOSMModule.RECEPTION) &&
      this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.READ))
    );
  }

  private buildVisibleModules(): HelpModuleLink[] {
    const all: Array<HelpModuleLink & { visible: boolean }> = [
      {
        id: 'reception',
        titleKey: 'USER_GUIDE.MODULES.RECEPTION.TITLE',
        descKey: 'USER_GUIDE.MODULES.RECEPTION.DESC',
        route: '/reception',
        icon: 'spa',
        accentClass: 'help-card--reception',
        visible: this.canAccessReception()
      },
      {
        id: 'production',
        titleKey: 'USER_GUIDE.MODULES.PRODUCTION.TITLE',
        descKey: 'USER_GUIDE.MODULES.PRODUCTION.DESC',
        route: '/storage',
        icon: 'water_drop',
        accentClass: 'help-card--production',
        visible:
          this.auth.hasModule(OOSMModule.PRODUCTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ))
      },
      {
        id: 'conditioning',
        titleKey: 'USER_GUIDE.MODULES.CONDITIONING.TITLE',
        descKey: 'USER_GUIDE.MODULES.CONDITIONING.DESC',
        route: '/of',
        icon: 'precision_manufacturing',
        accentClass: 'help-card--conditioning',
        visible:
          this.auth.hasModule(OOSMModule.CONDITIONING) &&
          this.auth.hasPermission(permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.OF, Action.READ))
      },
      {
        id: 'inventory',
        titleKey: 'USER_GUIDE.MODULES.INVENTORY.TITLE',
        descKey: 'USER_GUIDE.MODULES.INVENTORY.DESC',
        route: '/stock/dashboard',
        icon: 'inventory_2',
        accentClass: 'help-card--inventory',
        visible:
          this.auth.hasModule(OOSMModule.INVENTAIR) &&
          this.auth.hasPermission(permissionKey(OOSMModule.INVENTAIR, InventoryEntity.STOCKSEC, Action.READ))
      },
      {
        id: 'finance',
        titleKey: 'USER_GUIDE.MODULES.FINANCE.TITLE',
        descKey: 'USER_GUIDE.MODULES.FINANCE.DESC',
        route: '/finance',
        icon: 'account_balance_wallet',
        accentClass: 'help-card--finance',
        visible:
          this.auth.hasModule(OOSMModule.FINANCE) &&
          this.auth.hasAnyPermission([
            permissionKey(OOSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION, Action.READ),
            permissionKey(OOSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ)
          ])
      },
      {
        id: 'hr',
        titleKey: 'USER_GUIDE.MODULES.HR.TITLE',
        descKey: 'USER_GUIDE.MODULES.HR.DESC',
        route: '/hr',
        icon: 'groups',
        accentClass: 'help-card--hr',
        visible: this.canAccessHr()
      },
      {
        id: 'settings',
        titleKey: 'USER_GUIDE.MODULES.SETTINGS.TITLE',
        descKey: 'USER_GUIDE.MODULES.SETTINGS.DESC',
        route: '/settings/general-config',
        icon: 'settings',
        accentClass: 'help-card--settings',
        visible: this.auth.hasModule(OOSMModule.HABILITATION)
      }
    ];

    return all.filter((m) => m.visible);
  }

  private buildModuleTasks(): Record<string, HelpModuleTask[]> {
    const tasks: Record<string, HelpModuleTask[]> = {};

    if (this.canAccessReception()) {
      tasks['reception'] = [
        { labelKey: 'USER_GUIDE.TASKS.RECEPTION_LIST', route: '/reception/reception-list' },
        { labelKey: 'USER_GUIDE.TASKS.SUPPLIERS', route: '/reception/fournisseur' },
        { labelKey: 'USER_GUIDE.TASKS.OLIVE_QC', route: '/reception/olive_qc' }
      ];
    }

    if (
      this.auth.hasModule(OOSMModule.PRODUCTION) &&
      this.auth.hasPermission(permissionKey(OOSMModule.PRODUCTION, ProductionEntity.OILTRANSACTION, Action.READ))
    ) {
      tasks['production'] = [
        { labelKey: 'USER_GUIDE.TASKS.TANK_RECAP', route: '/storage/storage_recap' },
        { labelKey: 'USER_GUIDE.TASKS.OIL_MOVES', route: '/storage/oil-transactions' }
      ];
    }

    if (this.auth.hasModule(OOSMModule.CONDITIONING)) {
      tasks['conditioning'] = [
        { labelKey: 'USER_GUIDE.TASKS.PROJECTS', route: '/projets' },
        { labelKey: 'USER_GUIDE.TASKS.LABELS', route: '/labels' }
      ];
    }

    if (this.auth.hasModule(OOSMModule.INVENTAIR)) {
      tasks['inventory'] = [
        { labelKey: 'USER_GUIDE.TASKS.ARTICLES', route: '/stock/articles' },
        { labelKey: 'USER_GUIDE.TASKS.BOM', route: '/stock/boms' }
      ];
    }

    if (this.auth.hasModule(OOSMModule.FINANCE)) {
      tasks['finance'] = [
        { labelKey: 'USER_GUIDE.TASKS.OIL_SALES', route: '/finance/oil-sales' },
        { labelKey: 'USER_GUIDE.TASKS.TRANSACTIONS', route: '/finance/transactions' }
      ];
    }

    if (this.canAccessHr()) {
      tasks['hr'] = [
        { labelKey: 'USER_GUIDE.TASKS.HR_EMPLOYEES', route: '/hr/employees' },
        { labelKey: 'USER_GUIDE.TASKS.HR_CONTRACTS', route: '/hr/contracts' },
        { labelKey: 'USER_GUIDE.TASKS.HR_PAYROLL', route: '/hr/payroll-periods' },
        { labelKey: 'USER_GUIDE.TASKS.HR_LEAVE', route: '/hr/leave-requests' }
      ];
    }

    if (this.auth.hasModule(OOSMModule.HABILITATION)) {
      tasks['settings'] = [
        { labelKey: 'USER_GUIDE.TASKS.USERS', route: '/settings/users/dashboard' },
        { labelKey: 'USER_GUIDE.TASKS.QC_RULES', route: '/settings/quality-control' }
      ];
    }

    return tasks;
  }

  private buildCommonTasks(): HelpCommonTask[] {
    const tasks: Array<HelpCommonTask & { visible: boolean }> = [
      {
        labelKey: 'USER_GUIDE.TASKS.NEW_OLIVE',
        hintKey: 'USER_GUIDE.TASKS.NEW_OLIVE_HINT',
        route: '/reception/reception-olive/simple_reception',
        icon: 'add_circle',
        visible:
          this.auth.hasModule(OOSMModule.RECEPTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.NEW_OIL',
        hintKey: 'USER_GUIDE.TASKS.NEW_OIL_HINT',
        route: '/reception/reception-huile',
        icon: 'opacity',
        visible:
          this.auth.hasModule(OOSMModule.RECEPTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.RECEPTION, ReceptionEntity.UNIFIEDDELIVERY, Action.CREATE))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.OIL_SALES',
        hintKey: 'USER_GUIDE.TASKS.OIL_SALES_HINT',
        route: '/finance/oil-sales',
        icon: 'sell',
        visible:
          this.auth.hasModule(OOSMModule.FINANCE) &&
          this.auth.hasPermission(permissionKey(OOSMModule.FINANCE, FinanceEntity.OILSALE, Action.READ))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.TANK_RECAP',
        hintKey: 'USER_GUIDE.TASKS.TANK_RECAP_HINT',
        route: '/storage/storage_recap',
        icon: 'water_drop',
        visible:
          this.auth.hasModule(OOSMModule.PRODUCTION) &&
          this.auth.hasPermission(permissionKey(OOSMModule.PRODUCTION, ProductionEntity.STORAGEUNIT, Action.READ))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.NEW_OF',
        hintKey: 'USER_GUIDE.TASKS.NEW_OF_HINT',
        route: '/of/nouveau',
        icon: 'precision_manufacturing',
        visible:
          this.auth.hasModule(OOSMModule.CONDITIONING) &&
          this.auth.hasPermission(permissionKey(OOSMModule.CONDITIONING, ConditioningEntity.OF, Action.CREATE))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.MY_PROFILE',
        hintKey: 'USER_GUIDE.TASKS.MY_PROFILE_HINT',
        route: '/settings/profile',
        icon: 'person',
        visible: true
      },
      {
        labelKey: 'USER_GUIDE.TASKS.NEW_EMPLOYEE',
        hintKey: 'USER_GUIDE.TASKS.NEW_EMPLOYEE_HINT',
        route: '/hr/employees/new',
        icon: 'person_add',
        visible:
          this.canAccessHr() &&
          this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.EMPLOYEE, Action.CREATE))
      },
      {
        labelKey: 'USER_GUIDE.TASKS.HR_PAYROLL_RUN',
        hintKey: 'USER_GUIDE.TASKS.HR_PAYROLL_RUN_HINT',
        route: '/hr/payroll-periods',
        icon: 'receipt_long',
        visible:
          this.canAccessHr() &&
          this.auth.hasPermission(permissionKey(OOSMModule.HR, HREntity.PAYROLLPERIOD, Action.READ))
      }
    ];

    return tasks.filter((t) => t.visible);
  }
}

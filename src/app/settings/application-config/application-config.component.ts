import { ChangeDetectorRef, Component, HostListener, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeConfig, ThemeConfigService } from '../../shared/services/theme-config.service';
import { LIQUID_GLASS_TARGETS } from '../../shared/constants/liquid-glass.constants';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { ToastService } from '../../shared/services/toast.service';

type ThemeMode = ThemeConfig['layoutType'];
type LayoutType = ThemeConfig['layout'];
type ThemeColor = ThemeConfig['bodyColor'];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-application-config',
  standalone: true,
  imports: [CommonModule, SharedModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
  templateUrl: './application-config.component.html',
  styleUrls: ['./application-config.component.scss']
})
export class ApplicationConfigComponent implements OnInit {
  private readonly themeConfig = inject(ThemeConfigService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly companyProfileService = inject(CompanyProfileService);
  private readonly toast = inject(ToastService);

  layoutType: ThemeMode = 'light';
  contrast = false;
  caption = false;
  rtlLayout = false;
  bodyColor: ThemeColor = 'blue-theme';
  layout: LayoutType = 'vertical';
  boxLayouts = false;
  liquidGlass = false;
  mobileBottomNav = true;
  mobileDashboardCards = true;
  canInstallPwa = false;
  savingTenantTheme = false;

  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  readonly liquidGlassTargets = LIQUID_GLASS_TARGETS;

  ngOnInit(): void {
    this.loadFromService();
    this.hydrateThemeFromCompanyProfile();

    this.translate.onLangChange.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    this.canInstallPwa = true;
    this.cdr.markForCheck();
  }

  @HostListener('window:appinstalled')
  onAppInstalled(): void {
    this.deferredInstallPrompt = null;
    this.canInstallPwa = false;
    this.cdr.markForCheck();
  }

  setLayouts(type: ThemeMode): void {
    this.layoutType = type;
    this.applyPreview();
  }

  setThemeContrast(isLight: boolean): void {
    this.contrast = isLight;
    this.applyPreview();
  }

  setMenuCaption(hide: boolean): void {
    this.caption = hide;
    this.applyPreview();
  }

  setRtlLayout(rtl: boolean): void {
    this.rtlLayout = rtl;
    this.applyPreview();
  }

  setBodyColor(color: ThemeColor): void {
    this.bodyColor = color;
    this.applyPreview();
  }

  setMenuOrientation(layout: LayoutType): void {
    this.layout = layout;
    if (layout === 'horizontal' && this.rtlLayout) {
      this.rtlLayout = false;
    }
    this.applyPreview();
  }

  setBoxLayouts(boxed: boolean): void {
    this.boxLayouts = boxed;
    this.applyPreview();
  }

  setLiquidGlass(enabled: boolean): void {
    this.liquidGlass = enabled;
    this.applyPreview();
  }

  setMobileBottomNav(enabled: boolean): void {
    this.mobileBottomNav = enabled;
    this.applyPreview();
  }

  setMobileDashboardCards(enabled: boolean): void {
    this.mobileDashboardCards = enabled;
    this.applyPreview();
  }

  applySettings(): void {
    this.persistThemeConfig();
    this.persistTenantThemeAccent();
  }

  async installPwa(): Promise<void> {
    if (!this.deferredInstallPrompt) {
      this.toast.info('GENERAL_CONFIG_UI.PWA.NOT_AVAILABLE');
      return;
    }
    await this.deferredInstallPrompt.prompt();
    await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.canInstallPwa = false;
    this.cdr.markForCheck();
  }

  private persistThemeConfig(): void {
    const cfg = this.buildConfig();
    this.themeConfig.saveConfig(cfg);
    this.themeConfig.applyConfig(cfg);
  }

  private persistTenantThemeAccent(): void {
    const current = this.companyProfileService.getProfileFromCache();
    if (!current?.legalName) {
      return;
    }
    if (current.preferredThemeColor === this.bodyColor) {
      return;
    }
    this.savingTenantTheme = true;
    this.companyProfileService
      .saveProfile({
        ...current,
        preferredThemeColor: this.bodyColor
      })
      .subscribe({
        next: () => {
          this.savingTenantTheme = false;
          this.toast.success('GENERAL_CONFIG_UI.PWA.THEME_SAVED');
        },
        error: () => {
          this.savingTenantTheme = false;
          this.toast.error('CONTROLE_QUALITE.MESSAGES.ERROR.SAVE');
        }
      });
  }

  resetLayout(): void {
    const cfg = this.themeConfig.resetConfig();
    this.syncState(cfg);
  }

  private loadFromService(): void {
    const cfg = this.themeConfig.loadConfig();
    this.syncState(cfg);
    this.themeConfig.applyConfig(cfg);
  }

  private hydrateThemeFromCompanyProfile(): void {
    const applyPreferred = (preferred?: string | null) => {
      if (!preferred || preferred === this.bodyColor) {
        return;
      }
      this.bodyColor = preferred as ThemeColor;
      this.applyPreview();
    };

    const cached = this.companyProfileService.getProfileFromCache();
    if (cached?.preferredThemeColor) {
      applyPreferred(cached.preferredThemeColor);
    }

    this.companyProfileService.getProfile().subscribe({
      next: (profile) => applyPreferred(profile?.preferredThemeColor),
      error: () => undefined
    });
  }

  private applyPreview(): void {
    this.themeConfig.applyConfig(this.buildConfig());
  }

  private buildConfig(): ThemeConfig {
    return {
      layoutType: this.layoutType,
      contrast: this.contrast,
      caption: this.caption,
      rtlLayout: this.rtlLayout,
      bodyColor: this.bodyColor,
      layout: this.layout,
      boxLayouts: this.boxLayouts,
      liquidGlass: this.liquidGlass === true,
      mobileBottomNav: this.mobileBottomNav !== false,
      mobileDashboardCards: this.mobileDashboardCards !== false
    };
  }

  private syncState(cfg: ThemeConfig): void {
    this.layoutType = cfg.layoutType;
    this.contrast = cfg.contrast;
    this.caption = cfg.caption;
    this.rtlLayout = cfg.rtlLayout;
    this.bodyColor = cfg.bodyColor;
    this.layout = cfg.layout;
    this.boxLayouts = cfg.boxLayouts;
    this.liquidGlass = cfg.liquidGlass === true;
    this.mobileBottomNav = cfg.mobileBottomNav !== false;
    this.mobileDashboardCards = cfg.mobileDashboardCards !== false;
  }
}

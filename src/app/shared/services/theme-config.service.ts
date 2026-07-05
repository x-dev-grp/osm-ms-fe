import { inject, Injectable } from '@angular/core';
import { AbleProConfig } from '../../app-config';
import { ThemeLayoutService } from '../../theme/services/theme-layout.service';
import { LTR, RTL } from '../../theme/const';

export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  layoutType: 'light' | 'dark' | 'auto';
  contrast: boolean;
  caption: boolean;
  rtlLayout: boolean;
  bodyColor: string;
  layout: 'vertical' | 'horizontal' | 'compact';
  boxLayouts: boolean;
  liquidGlass: boolean;
  mobileBottomNav: boolean;
  mobileDashboardCards: boolean;
}

@Injectable({ providedIn: 'root' })
export class ThemeConfigService {
  private readonly themeLayout = inject(ThemeLayoutService);
  private readonly STORAGE_KEY = 'themeConfig';
  private autoModeMediaQuery?: MediaQueryList;
  private autoModeListener?: (event: MediaQueryListEvent) => void;
  private readonly defaultConfig: ThemeConfig = {
    layoutType: 'light',
    contrast: false,
    caption: false,
    rtlLayout: false,
    bodyColor: 'blue-theme',
    layout: 'vertical',
    boxLayouts: false,
    liquidGlass: false,
    mobileBottomNav: true,
    mobileDashboardCards: true
  };
  private readonly themeClasses = [
    'blue-theme',
    'indigo-theme',
    'purple-theme',
    'pink-theme',
    'red-theme',
    'orange-theme',
    'yellow-theme',
    'green-theme',
    'teal-theme',
    'cyan-theme'
  ];

  /** Apply saved theme as early as possible (APP bootstrap). */
  init(): void {
    const cfg = this.loadConfig();
    this.syncAbleProConfig(cfg);
    this.applyConfig(cfg);
  }

  resolveMode(layoutType: ThemeConfig['layoutType']): ResolvedThemeMode {
    if (layoutType === 'dark') {
      return 'dark';
    }
    if (layoutType === 'light') {
      return 'light';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /** Load from LS (if any), override static defaults, and return a config */
  loadConfig(): ThemeConfig {
    const cfg = this.mergeConfig(this.readStoredPartial());
    return this.normalizeConfig(this.syncRtlWithLanguage(cfg));
  }

  private readStoredPartial(): Partial<ThemeConfig> {
    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) {
      return {};
    }

    try {
      return JSON.parse(json) as Partial<ThemeConfig>;
    } catch {
      console.warn('Invalid themeConfig in localStorage, using defaults');
      return {};
    }
  }

  private mergeConfig(stored: Partial<ThemeConfig>): ThemeConfig {
    return {
      ...this.defaultConfig,
      ...stored,
      liquidGlass: stored.liquidGlass === true,
      mobileBottomNav: stored.mobileBottomNav !== false,
      mobileDashboardCards: stored.mobileDashboardCards !== false
    };
  }

  resetConfig(): ThemeConfig {
    const cfg = this.normalizeConfig(this.syncRtlWithLanguage(this.defaultConfig));
    this.saveConfig(cfg);
    this.applyConfig(cfg);
    return cfg;
  }

  private normalizeConfig(cfg: ThemeConfig): ThemeConfig {
    if (cfg.layout === 'horizontal' && cfg.rtlLayout) {
      return { ...cfg, layout: 'vertical' };
    }
    return cfg;
  }

  private syncRtlWithLanguage(cfg: ThemeConfig): ThemeConfig {
    if (typeof localStorage === 'undefined') {
      return cfg;
    }

    const lang = localStorage.getItem('app_language');
    if (lang === 'ar') {
      return { ...cfg, rtlLayout: true };
    }
    if (lang === 'en' || lang === 'fr') {
      return { ...cfg, rtlLayout: false };
    }

    return cfg;
  }

  /** Persist both to LS and to the static defaults */
  saveConfig(cfg: Partial<ThemeConfig>): void {
    const merged = this.mergeConfig({ ...this.readStoredPartial(), ...cfg });
    const normalized = this.normalizeConfig(this.syncRtlWithLanguage(merged));

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
    this.syncAbleProConfig(normalized);
  }

  private syncAbleProConfig(cfg: ThemeConfig): void {
    AbleProConfig.layout = cfg.layout;
    AbleProConfig.isDarkMode = cfg.layoutType;
    AbleProConfig.theme_color = cfg.bodyColor;
    AbleProConfig.isRtlLayout = cfg.rtlLayout;
    AbleProConfig.isBox_container = cfg.boxLayouts;
    AbleProConfig.theme_contrast = cfg.contrast;
    AbleProConfig.menu_caption = cfg.caption;
    AbleProConfig.liquidGlass = cfg.liquidGlass;
    AbleProConfig.mobileBottomNav = cfg.mobileBottomNav;
    AbleProConfig.mobileDashboardCards = cfg.mobileDashboardCards;
  }

  /** Apply a given config to <body> classes and html dir */
  applyConfig(cfg: ThemeConfig): void {
    this.applyAppearanceClasses(cfg);

    // 2) contrast (Able Pro uses theme-contrast on body)
    document.body.classList.toggle('theme-contrast', cfg.contrast);
    document.body.classList.toggle('gray-contrast', !cfg.contrast);

    // 3) caption
    document.body.classList.toggle('hide-caption', cfg.caption);
    document.querySelector('.pc-sidebar')?.classList.toggle('caption-hide', cfg.caption);

    // 4) rtl
    document.documentElement.dir = cfg.rtlLayout ? 'rtl' : 'ltr';
    document.body.classList.toggle('able-pro-rtl', cfg.rtlLayout);

    // 5) primary color
    document.body.classList.remove(...this.themeClasses);
    document.body.classList.add(cfg.bodyColor);

    // 6) boxed
    document.body.classList.toggle('boxed', cfg.boxLayouts);
    document.querySelector('.app-container')?.classList.toggle('container', cfg.boxLayouts);

    // 7) menu layout class
    document.body.classList.remove('vertical', 'horizontal', 'compact');
    document.body.classList.add(cfg.layout);

    // 8) sync layout service so shell components react immediately
    this.themeLayout.layout.set(cfg.layout);
    this.themeLayout.directionChange.set(cfg.rtlLayout ? RTL : LTR);
    this.themeLayout.isDarkMode.set(cfg.layoutType);
    this.themeLayout.color.set(cfg.bodyColor);

    document.body.classList.toggle('liquid-glass-ui', cfg.liquidGlass);
    document.body.classList.toggle('mobile-bottom-nav-ui', cfg.mobileBottomNav);
    document.body.classList.toggle('mobile-dashboard-cards-ui', cfg.mobileDashboardCards);

    this.themeLayout.mobileBottomNavEnabled.set(cfg.mobileBottomNav);
    this.themeLayout.mobileDashboardCardsEnabled.set(cfg.mobileDashboardCards);

    this.syncAutoModeListener(cfg);
  }

  applyrtl(isRtl: boolean): void {
    // 1) load current config
    const cfg = this.loadConfig();

    // 2) update the flag
    const next: ThemeConfig = { ...cfg, rtlLayout: isRtl };

    // 3) persist (updates AbleProConfig + localStorage)
    this.saveConfig(next);

    // 4) apply to DOM (sets documentElement.dir, classes, etc.)
    this.applyConfig(next);
  }

  private applyAppearanceClasses(cfg: ThemeConfig): void {
    const resolved = this.resolveMode(cfg.layoutType);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.setAttribute('data-theme-mode', resolved);
  }

  private syncAutoModeListener(cfg: ThemeConfig): void {
    if (this.autoModeMediaQuery && this.autoModeListener) {
      this.autoModeMediaQuery.removeEventListener('change', this.autoModeListener);
    }

    this.autoModeMediaQuery = undefined;
    this.autoModeListener = undefined;

    if (cfg.layoutType !== 'auto' || typeof window === 'undefined') {
      return;
    }

    this.autoModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.autoModeListener = () => {
      const current = this.loadConfig();
      if (current.layoutType === 'auto') {
        this.applyAppearanceClasses(current);
      }
    };
    this.autoModeMediaQuery.addEventListener('change', this.autoModeListener);
  }
}

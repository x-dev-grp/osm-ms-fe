import { Injectable } from '@angular/core';
import { AbleProConfig } from '../../app-config';

export interface ThemeConfig {
  layoutType: 'light'|'dark'|'auto';
  contrast: boolean;
  caption: boolean;
  rtlLayout: boolean;
  bodyColor: string;
  layout: 'vertical'|'horizontal'|'compact';
  boxLayouts: boolean;
}

@Injectable({ providedIn: 'root' })
export class ThemeConfigService {

  private readonly STORAGE_KEY = 'themeConfig';
  private readonly themeClasses = [
    'blue-theme','indigo-theme','purple-theme','pink-theme',
    'red-theme','orange-theme','yellow-theme','green-theme',
    'teal-theme','cyan-theme'
  ];

  /** Load from LS (if any), override static defaults, and return a config */
  loadConfig(): ThemeConfig {
    const def: ThemeConfig = {
      layoutType:  AbleProConfig.isDarkMode as any,
      contrast:    AbleProConfig.theme_contrast,
      caption:     AbleProConfig.menu_caption,
      rtlLayout:   AbleProConfig.isRtlLayout,
      bodyColor:   AbleProConfig.theme_color,
      layout:      AbleProConfig.layout as any,
      boxLayouts:  AbleProConfig.isBox_container
    };

    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) { return def; }

    try {
      const cfg = JSON.parse(json) as Partial<ThemeConfig>;
      return { ...def, ...cfg };
    } catch {
      console.warn('Invalid themeConfig in localStorage, using defaults');
      return def;
    }
  }

  /** Persist both to LS and to the static defaults */
  saveConfig(cfg: ThemeConfig): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cfg));
    AbleProConfig.layout          = cfg.layout;
    AbleProConfig.isDarkMode      = cfg.layoutType;
    AbleProConfig.theme_color     = cfg.bodyColor;
    AbleProConfig.isRtlLayout     = cfg.rtlLayout;
    AbleProConfig.isBox_container = cfg.boxLayouts;
    AbleProConfig.theme_contrast  = cfg.contrast;
    AbleProConfig.menu_caption    = cfg.caption;
  }

  /** Apply a given config to <body> classes and html dir */
  applyConfig(cfg: ThemeConfig): void {
    // 1) light/dark
    document.body.classList.remove('light','dark');
    if (cfg.layoutType === 'light') document.body.classList.add('light');
    if (cfg.layoutType === 'dark')  document.body.classList.add('dark');
    // (auto: leave default or handle prefers-color-scheme)

    // 2) contrast
    document.body.classList.toggle('gray-contrast', !cfg.contrast);

    // 3) caption
    document.body.classList.toggle('hide-caption', cfg.caption);

    // 4) rtl
    document.documentElement.dir = cfg.rtlLayout ? 'rtl' : 'ltr';

    // 5) primary color
    document.body.classList.remove(...this.themeClasses);
    document.body.classList.add(cfg.bodyColor);

    // 6) boxed
    document.body.classList.toggle('boxed', cfg.boxLayouts);

    // 7) menu layout class
    document.body.classList.remove('vertical','horizontal','compact');
    document.body.classList.add(cfg.layout);
  }
}

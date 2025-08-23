import { Component, OnInit, ViewChild, inject, Renderer2, ChangeDetectorRef } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { CommonModule }       from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AbleProConfig } from '../../app-config';
import { ThemeLayoutService } from '../../theme/services/theme-layout.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type ThemeMode = 'light' | 'dark' | 'auto';
type LayoutType = 'vertical' | 'horizontal' | 'compact';
type ThemeColor = 'blue-theme' | 'indigo-theme' | 'purple-theme' | 'pink-theme' |
                 'red-theme' | 'orange-theme' | 'yellow-theme' | 'green-theme' |
                 'teal-theme' | 'cyan-theme';

interface ThemeConfig {
  layoutType: ThemeMode;
  contrast: boolean;
  caption: boolean;
  rtlLayout: boolean;
  bodyColor: ThemeColor;
  layout: LayoutType;
  boxLayouts: boolean;
}

@Component({
  selector: 'app-application-config',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './application-config.component.html',
  styleUrls: ['./application-config.component.scss']
})
export class ApplicationConfigComponent implements OnInit {
  private renderer = inject(Renderer2);
  private themeService = inject(ThemeLayoutService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('drawer') drawer!: MatDrawer;

  // Component state with proper typing
  layoutType: ThemeMode = AbleProConfig.isDarkMode as ThemeMode;
  contrast: boolean = AbleProConfig.theme_contrast;
  caption: boolean = AbleProConfig.menu_caption;
  rtlLayout: boolean = AbleProConfig.isRtlLayout;
  bodyColor: ThemeColor = AbleProConfig.theme_color as ThemeColor;
  layout: LayoutType = AbleProConfig.layout as LayoutType;
  boxLayouts: boolean = AbleProConfig.isBox_container;

  private readonly THEME_CLASSES = {
    modes: ['light', 'dark'] as const,
    layouts: ['vertical', 'horizontal', 'compact'] as const,
    colors: [
      'blue-theme', 'indigo-theme', 'purple-theme', 'pink-theme',
      'red-theme', 'orange-theme', 'yellow-theme', 'green-theme',
      'teal-theme', 'cyan-theme'
    ] as const
  };

  ngOnInit(): void {
    this.loadThemeConfig();

    // Subscribe to language changes
    this.translate.onLangChange.subscribe(() => {
      // Force view update when language changes
      this.cdr.detectChanges();
    });

    // Set initial language
    const currentLang = this.translate.currentLang || 'en';
    this.translate.use(currentLang);
  }

  setLayouts(type: ThemeMode): void {
    try {
      this.layoutType = type;
      this.THEME_CLASSES.modes.forEach(mode => {
        this.renderer.removeClass(document.body, mode);
      });
      if (type !== 'auto') {
        this.renderer.addClass(document.body, type);
      }
    } catch (error) {
      console.error('Error setting layout mode:', error);
    }
  }

  setThemeContrast(isLight: boolean): void {
    try {
      this.contrast = isLight;
      this.renderer.setProperty(
        document.body.classList,
        'gray-contrast',
        !isLight
      );
    } catch (error) {
      console.error('Error setting theme contrast:', error);
    }
  }

  setMenuCaption(hide: boolean): void {
    try {
      this.caption = hide;
      this.renderer.setProperty(
        document.body.classList,
        'hide-caption',
        hide
      );
    } catch (error) {
      console.error('Error setting menu caption:', error);
    }
  }

  setRtlLayout(rtl: boolean): void {
    try {
      this.rtlLayout = rtl;
      this.renderer.setAttribute(document.body, 'dir', rtl ? 'rtl' : 'ltr');
    } catch (error) {
      console.error('Error setting RTL layout:', error);
    }
  }

  setBodyColor(color: ThemeColor): void {
    try {
      this.bodyColor = color;
      this.THEME_CLASSES.colors.forEach(theme => {
        this.renderer.removeClass(document.body, theme);
      });
      this.renderer.addClass(document.body, color);
    } catch (error) {
      console.error('Error setting body color:', error);
    }
  }

  setMenuOrientation(layout: LayoutType): void {
    try {
      this.layout = layout;
      this.THEME_CLASSES.layouts.forEach(layoutType => {
        this.renderer.removeClass(document.body, layoutType);
      });
      this.renderer.addClass(document.body, layout);
    } catch (error) {
      console.error('Error setting menu orientation:', error);
    }
  }

  setBoxLayouts(boxed: boolean): void {
    try {
      this.boxLayouts = boxed;
      this.renderer.setProperty(
        document.body.classList,
        'boxed',
        boxed
      );
    } catch (error) {
      console.error('Error setting box layouts:', error);
    }
  }

  applySettings(): void {
    try {
      this.saveThemeConfig();
      window.location.reload();
    } catch (error) {
      console.error('Error applying settings:', error);
    }
  }

  resetLayout(): void {
    try {
      localStorage.removeItem('themeConfig');
      location.reload();
    } catch (error) {
      console.error('Error resetting layout:', error);
    }
  }

  private saveThemeConfig(): void {
    try {
      const cfg: ThemeConfig = {
        layoutType: this.layoutType,
        contrast: this.contrast,
        caption: this.caption,
        rtlLayout: this.rtlLayout,
        bodyColor: this.bodyColor,
        layout: this.layout,
        boxLayouts: this.boxLayouts
      };
      localStorage.setItem('themeConfig', JSON.stringify(cfg));

      // Update AbleProConfig
      AbleProConfig.layout = this.layout;
      AbleProConfig.isDarkMode = this.layoutType;
      AbleProConfig.theme_contrast = this.contrast;
      AbleProConfig.menu_caption = this.caption;
      AbleProConfig.isRtlLayout = this.rtlLayout;
      AbleProConfig.isBox_container = this.boxLayouts;
      AbleProConfig.theme_contrast = this.contrast;
      AbleProConfig.menu_caption = this.caption;
    } catch (error) {
      console.error('Error saving theme config:', error);
      throw error;
    }
  }

  private loadThemeConfig(): void {
    try {
      const json = localStorage.getItem('themeConfig');
      if (!json) return;

      const cfg = JSON.parse(json) as ThemeConfig;

      // Update component state
      this.layoutType = cfg.layoutType;
      this.contrast = cfg.contrast;
      this.caption = cfg.caption;
      this.rtlLayout = cfg.rtlLayout;
      this.bodyColor = cfg.bodyColor;
      this.layout = cfg.layout;
      this.boxLayouts = cfg.boxLayouts;

      // Update AbleProConfig
      AbleProConfig.layout = this.layout;
      AbleProConfig.isDarkMode = this.layoutType;
      AbleProConfig.theme_color = this.bodyColor;
      AbleProConfig.isRtlLayout = this.rtlLayout;
      AbleProConfig.isBox_container = this.boxLayouts;
      AbleProConfig.theme_contrast = this.contrast;
      AbleProConfig.menu_caption = this.caption;

      // Apply all settings
      this.setLayouts(this.layoutType);
      this.setThemeContrast(this.contrast);
      this.setMenuCaption(this.caption);
      this.setRtlLayout(this.rtlLayout);
      this.setBodyColor(this.bodyColor);
      this.setMenuOrientation(this.layout);
      this.setBoxLayouts(this.boxLayouts);
    } catch (error) {
      console.error('Error loading theme config:', error);
    }
  }
}

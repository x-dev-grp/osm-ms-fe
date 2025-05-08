import { Component, OnInit, ViewChild, inject, Renderer2 } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { CommonModule }       from '@angular/common';
import { SharedModule } from '../../demo/shared/shared.module';
import { AbleProConfig } from '../../app-config';
import { ThemeLayoutService } from '../../@theme/services/theme-layout.service';


@Component({
  selector: 'app-application-config',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './application-config.component.html',
  styleUrls: ['./application-config.component.scss']
})
export class ApplicationConfigComponent implements OnInit {
  private renderer     = inject(Renderer2);
  private themeService = inject(ThemeLayoutService);

  @ViewChild('drawer') drawer!: MatDrawer;

  // component state (initialized from static defaults)
  layoutType: 'light' | 'dark' | 'auto'         = AbleProConfig.isDarkMode as any;
  contrast: boolean                             = AbleProConfig.theme_contrast;
  caption: boolean                              = AbleProConfig.menu_caption;
  rtlLayout: boolean                            = AbleProConfig.isRtlLayout;
  bodyColor: string                             = AbleProConfig.theme_color;
  layout: 'vertical' | 'horizontal' | 'compact' = AbleProConfig.layout as any;
  boxLayouts: boolean                           = AbleProConfig.isBox_container;

  ngOnInit(): void {
    this.loadThemeConfig();
  }

  // ────────────────────────────────────────────────────────────────────────

  SetLayouts(type: 'light' | 'dark' | 'auto'): void {
    this.layoutType = type;
    document.body.classList.remove('light','dark');
    if (type === 'light') document.body.classList.add('light');
    if (type === 'dark')  document.body.classList.add('dark');
  }

  setThemeContrast(isLight: boolean): void {
    this.contrast = isLight;
    document.body.classList.toggle('gray-contrast', !isLight);
  }

  setMenuCaption(hide: boolean): void {
    this.caption = hide;
    document.body.classList.toggle('hide-caption', hide);
  }

  setRtlLayout(rtl: boolean): void {
    this.rtlLayout = rtl;
    document.body.dir = rtl ? 'rtl' : 'ltr';
  }

  SetBodyColor(color: string): void {
    this.bodyColor = color;
    const themes = [
      'blue-theme','indigo-theme','purple-theme','pink-theme',
      'red-theme','orange-theme','yellow-theme','green-theme',
      'teal-theme','cyan-theme'
    ];
    document.body.classList.remove(...themes);
    document.body.classList.add(color);
  }

  setMenuOrientation(layout: 'vertical' | 'horizontal' | 'compact'): void {
    this.layout = layout;
    document.body.classList.remove('vertical','horizontal','compact');
    document.body.classList.add(layout);
  }

  setBoxLayouts(boxed: boolean): void {
    this.boxLayouts = boxed;
    document.body.classList.toggle('boxed', boxed);
  }

  applySettings(): void {
    this.saveThemeConfig();
    window.location.reload();
  }

  setResetLayout(): void {
     localStorage.removeItem('themeConfig');
    location.reload();
  }

  // ────────────────────────────────────────────────────────────────────────

  private saveThemeConfig(): void {
    const cfg = {
      layoutType: this.layoutType,
      contrast:   this.contrast,
      caption:    this.caption,
      rtlLayout:  this.rtlLayout,
      bodyColor:  this.bodyColor,
      layout:     this.layout,
      boxLayouts: this.boxLayouts
    };
    localStorage.setItem('themeConfig', JSON.stringify(cfg));

    AbleProConfig.layout          = this.layout;
    AbleProConfig.isDarkMode      = this.layoutType;
    AbleProConfig.theme_color     = this.bodyColor;
    AbleProConfig.isRtlLayout     = this.rtlLayout;
    AbleProConfig.isBox_container = this.boxLayouts;
    AbleProConfig.theme_contrast  = this.contrast;
    AbleProConfig.menu_caption    = this.caption;
  }

  private loadThemeConfig(): void {
    const json = localStorage.getItem('themeConfig');
    if (!json) { return; }

    try {
      const cfg = JSON.parse(json);
      this.layoutType = cfg.layoutType;
      this.contrast   = cfg.contrast;
      this.caption    = cfg.caption;
      this.rtlLayout  = cfg.rtlLayout;
      this.bodyColor  = cfg.bodyColor;
      this.layout     = cfg.layout;
      this.boxLayouts = cfg.boxLayouts;

      AbleProConfig.layout          = this.layout;
      AbleProConfig.isDarkMode      = this.layoutType;
      AbleProConfig.theme_color     = this.bodyColor;
      AbleProConfig.isRtlLayout     = this.rtlLayout;
      AbleProConfig.isBox_container = this.boxLayouts;
      AbleProConfig.theme_contrast  = this.contrast;
      AbleProConfig.menu_caption    = this.caption;

      this.SetLayouts(this.layoutType);
      this.setThemeContrast(this.contrast);
      this.setMenuCaption(this.caption);
      this.setRtlLayout(this.rtlLayout);
      this.SetBodyColor(this.bodyColor);
      this.setMenuOrientation(this.layout);
      this.setBoxLayouts(this.boxLayouts);

    } catch (err) {
      console.warn('Could not parse saved themeConfig', err);
    }
  }
}

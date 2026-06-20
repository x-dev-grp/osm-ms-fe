import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeConfig, ThemeConfigService } from '../../shared/services/theme-config.service';

type ThemeMode = ThemeConfig['layoutType'];
type LayoutType = ThemeConfig['layout'];
type ThemeColor = ThemeConfig['bodyColor'];

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

  layoutType: ThemeMode = 'light';
  contrast = false;
  caption = false;
  rtlLayout = false;
  bodyColor: ThemeColor = 'blue-theme';
  layout: LayoutType = 'vertical';
  boxLayouts = false;

  ngOnInit(): void {
    this.loadFromService();

    this.translate.onLangChange.subscribe(() => {
      this.cdr.detectChanges();
    });
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

  applySettings(): void {
    const cfg = this.buildConfig();
    this.themeConfig.saveConfig(cfg);
    this.themeConfig.applyConfig(cfg);
  }

  resetLayout(): void {
    localStorage.removeItem('themeConfig');
    const cfg = this.themeConfig.loadConfig();
    this.syncState(cfg);
    this.themeConfig.applyConfig(cfg);
  }

  private loadFromService(): void {
    const cfg = this.themeConfig.loadConfig();
    this.syncState(cfg);
    this.themeConfig.applyConfig(cfg);
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
      boxLayouts: this.boxLayouts
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
  }
}

import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ThemeLayoutService } from '../../theme/services/theme-layout.service';
import { LTR, RTL } from '../../theme/const';
import { ThemeConfigService } from './theme-config.service';
import { NotificationTextService } from './notification-text.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly themeLayout = inject(ThemeLayoutService);
  private readonly themeConfig = inject(ThemeConfigService);
  private readonly notificationTextService = inject(NotificationTextService);

  initFromStorage(): Promise<void> {
    this.translate.addLangs(['en', 'fr', 'ar']);
    this.translate.setDefaultLang('en');

    const lang = this.resolveInitialLanguage();
    return this.loadLanguage(lang, true);
  }

  applyLanguage(language: string, persist = true): void {
    void this.loadLanguage(this.normalizeLanguage(language), persist);
  }

  private resolveInitialLanguage(): string {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && this.isSupported(savedLang)) {
      return savedLang;
    }

    const browserLang = this.translate.getBrowserLang();
    return browserLang?.match(/en|fr|ar/) ? browserLang! : 'en';
  }

  private normalizeLanguage(language: string): string {
    return this.isSupported(language) ? language : 'en';
  }

  private isSupported(language: string): boolean {
    return ['en', 'fr', 'ar'].includes(language);
  }

  private loadLanguage(language: string, persist: boolean): Promise<void> {
    const normalized = this.normalizeLanguage(language);
    const alreadyLoaded = !!this.translate.translations[normalized];

    if (this.translate.currentLang === normalized && alreadyLoaded) {
      this.syncLanguageSideEffects(normalized, persist);
      return Promise.resolve();
    }

    return firstValueFrom(this.translate.use(normalized)).then(() => {
      this.syncLanguageSideEffects(normalized, persist);
    });
  }

  private syncLanguageSideEffects(language: string, persist: boolean): void {
    if (persist) {
      localStorage.setItem('app_language', language);
    }

    const isRtl = language === 'ar';
    this.themeLayout.directionChange.set(isRtl ? RTL : LTR);
    this.themeConfig.applyrtl(isRtl);
    document.documentElement.lang = language;
    this.notificationTextService.languageVersion.update((value) => value + 1);
  }
}

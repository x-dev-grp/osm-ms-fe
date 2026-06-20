import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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

  initFromStorage(): void {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      this.applyLanguage(savedLang, false);
      return;
    }

    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang?.match(/en|fr|ar/) ? browserLang! : 'en';
    this.applyLanguage(lang, false);
  }

  applyLanguage(language: string, persist = true): void {
    const normalized = ['en', 'fr', 'ar'].includes(language) ? language : 'en';
    this.translate.use(normalized);

    if (persist) {
      localStorage.setItem('app_language', normalized);
    }

    const isRtl = normalized === 'ar';
    this.themeLayout.directionChange.set(isRtl ? RTL : LTR);
    this.themeConfig.applyrtl(isRtl);
    document.documentElement.lang = normalized;
    this.notificationTextService.languageVersion.update((value) => value + 1);
  }
}

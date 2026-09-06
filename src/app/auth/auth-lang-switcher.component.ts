import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from 'src/app/shared/services/language.service';

@Component({
  selector: 'app-auth-lang-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="auth-lang" role="group" [attr.aria-label]="'AUTO.LANGUAGE' | translate">
      @for (lang of languages; track lang.code) {
        <button
          type="button"
          class="auth-lang__btn"
          [class.auth-lang__btn--active]="currentLang === lang.code"
          (click)="setLanguage(lang.code)"
          [attr.aria-pressed]="currentLang === lang.code"
          [attr.aria-label]="lang.labelKey | translate"
        >
          {{ lang.short }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .auth-lang {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.28);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 24px rgba(28, 36, 22, 0.18);
      }

      .auth-lang__btn {
        min-width: 40px;
        height: 32px;
        padding: 0 10px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: rgba(255, 255, 255, 0.88);
        font: inherit;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        cursor: pointer;
        transition:
          background 0.18s ease,
          color 0.18s ease,
          transform 0.18s ease;
      }

      .auth-lang__btn:hover {
        background: rgba(255, 255, 255, 0.14);
      }

      .auth-lang__btn--active {
        background: rgba(255, 255, 255, 0.92);
        color: #24351a;
        box-shadow: 0 2px 8px rgba(28, 36, 22, 0.16);
      }

      .auth-lang__btn:focus-visible {
        outline: 2px solid rgba(196, 163, 90, 0.9);
        outline-offset: 2px;
      }
    `
  ]
})
export class AuthLangSwitcherComponent {
  private readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly languages = [
    { code: 'fr', short: 'FR', labelKey: 'AUTO.FRANCAIS' },
    { code: 'en', short: 'EN', labelKey: 'AUTO.ENGLISH_UK' },
    { code: 'ar', short: 'AR', labelKey: 'AUTO.ARABIC' }
  ] as const;

  get currentLang(): string {
    return this.translate.currentLang || localStorage.getItem('app_language') || 'en';
  }

  setLanguage(code: string): void {
    this.languageService.applyLanguage(code);
  }
}

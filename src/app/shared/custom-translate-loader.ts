import { TranslateLoader } from '@ngx-translate/core';
import { Observable, from, of } from 'rxjs';

type TranslationDictionary = Record<string, unknown>;

const translationCache = new Map<string, TranslationDictionary>();

export class CustomTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationDictionary> {
    const normalized = ['en', 'fr', 'ar'].includes(lang) ? lang : 'en';
    const cached = translationCache.get(normalized);
    if (cached) {
      return of(cached);
    }

    const loader =
      normalized === 'fr'
        ? import('../../assets/i18n/fr.json')
        : normalized === 'ar'
          ? import('../../assets/i18n/ar.json')
          : import('../../assets/i18n/en.json');

    return from(
      loader.then((module) => {
        const payload = (module as { default?: TranslationDictionary }).default ?? module;
        const translations = payload as TranslationDictionary;
        translationCache.set(normalized, translations);
        return translations;
      })
    );
  }
}

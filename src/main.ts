import 'zone.js';

import { APP_INITIALIZER, enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';

import { environment } from './environments/environment';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ErrorInterceptor } from 'src/app/interceptors/error.interceptor';
import { ResponseMessageInterceptor } from './app/interceptors/response-message.interceptor';
import { AppRoutingModule } from './app/app-routing.module';
import { SharedModule } from './app/shared/shared.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AuthenticationService } from './app/auth/services/authentication.service';
import { CookieService } from 'ngx-cookie-service';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomTranslateLoader } from './app/shared/custom-translate-loader';
import { ThemeConfigService } from './app/shared/services/theme-config.service';
import { PwaUpdateService } from './app/shared/services/pwa-update.service';
import { LanguageService } from './app/shared/services/language.service';

function initApp(languageService: LanguageService, themeConfig: ThemeConfigService) {
  return () =>
    languageService.initFromStorage().then(() => {
      themeConfig.init();
    });
}

function initAuth(authService: AuthenticationService) {
  return () => authService.bootstrapSession();
}

function initPwa(pwaUpdateService: PwaUpdateService) {
  return () => {
    pwaUpdateService.init();
  };
}

if (environment.production) {
  enableProdMode();
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    AuthenticationService,
    CookieService,
    TranslateService,
    importProvidersFrom(
      AppRoutingModule,
      SharedModule,
      BrowserModule,
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useClass: CustomTranslateLoader
        }
      })
    ),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ResponseMessageInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'fr' },
    { provide: APP_INITIALIZER, useFactory: initApp, deps: [LanguageService, ThemeConfigService], multi: true },
    { provide: APP_INITIALIZER, useFactory: initAuth, deps: [AuthenticationService], multi: true },
    { provide: APP_INITIALIZER, useFactory: initPwa, deps: [PwaUpdateService], multi: true },
    [provideHttpClient(withInterceptorsFromDi())],
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}).catch((err) => console.error(err));

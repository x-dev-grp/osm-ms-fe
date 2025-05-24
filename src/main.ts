import { enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';

import { environment } from './environments/environment';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ErrorInterceptor } from 'src/app/interceptors/error.interceptor';
import { AppRoutingModule } from './app/app-routing.module';
import { SharedModule } from './app/demo/shared/shared.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { GuestModule } from './app/demo/layout/front';
import { AppComponent } from './app/app.component';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AuthenticationService } from './app/auth/services/authentication.service';
 import { CookieService } from 'ngx-cookie-service';
import { TranslateService } from '@ngx-translate/core';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    AuthenticationService,
    CookieService,
    TranslateService,
    importProvidersFrom(AppRoutingModule, SharedModule, BrowserModule, GuestModule),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'fr' },
    [provideHttpClient(withInterceptorsFromDi())],
    provideAnimations(), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
}).catch((err) => console.error(err));

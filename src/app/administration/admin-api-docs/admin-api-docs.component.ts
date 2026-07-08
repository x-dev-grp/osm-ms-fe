import { AfterViewInit, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-es-bundle.js';
import SwaggerUIStandalonePreset from 'swagger-ui-dist/swagger-ui-standalone-preset.js';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { AdminSettingsService } from '../admin-settings/services/admin-settings.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-admin-api-docs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-api-docs.component.html',
  styleUrls: ['./admin-api-docs.component.scss']
})
export class AdminApiDocsComponent implements OnInit, AfterViewInit {
  private readonly tokenService = inject(TokenService);
  private readonly settingsService = inject(AdminSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('swaggerHost', { static: false }) swaggerHost?: ElementRef<HTMLElement>;

  loading = true;
  loadError = false;
  swaggerEnabled = false;

  private viewReady = false;
  private statusReady = false;
  private swaggerInitialized = false;

  ngOnInit(): void {
    this.settingsService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.swaggerEnabled = status.features?.['swagger']?.enabled ?? false;
          this.statusReady = true;
          this.loading = false;
          this.tryInitSwagger();
        },
        error: () => {
          this.loading = false;
          this.loadError = true;
        }
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryInitSwagger();
  }

  private tryInitSwagger(): void {
    if (!this.viewReady || !this.statusReady || !this.swaggerEnabled || this.swaggerInitialized) {
      return;
    }
    if (!this.swaggerHost?.nativeElement) {
      return;
    }
    this.initSwaggerUi();
  }

  private initSwaggerUi(): void {
    const token = this.tokenService.getToken();
    if (!token) {
      this.loadError = true;
      return;
    }

    const apiBase = `${environment.apiUrl}/v3/api-docs`;
    const groups = [
      'all',
      'security',
      'production',
      'inventory',
      'conditioning',
      'finance',
      'hr',
      'administration',
      'documents'
    ];

    SwaggerUIBundle({
      domNode: this.swaggerHost!.nativeElement,
      urls: groups.map((group) => ({
        url: `${apiBase}/${group}`,
        name: group.charAt(0).toUpperCase() + group.slice(1)
      })),
      'urls.primaryName': 'All',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true,
      persistAuthorization: true,
      requestInterceptor: (request: { headers: Record<string, string> }) => {
        const accessToken = this.tokenService.getToken();
        if (accessToken) {
          request.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return request;
      },
      onComplete: () => {
        this.swaggerInitialized = true;
      },
      onFailure: () => {
        this.loadError = true;
      }
    });
  }
}

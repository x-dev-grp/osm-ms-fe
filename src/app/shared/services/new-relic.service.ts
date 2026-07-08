import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';
import {environment} from 'src/environments/environment';

export interface PublicObservabilityConfig {
  newRelicBrowserEnabled: boolean;
  accountId?: string;
  applicationId?: string;
  licenseKey?: string;
  trustKey?: string;
}

type BrowserAgentInstance = {
  log?: (message: string, options?: { level?: string; customAttributes?: Record<string, unknown> }) => void;
  noticeError?: (error: Error, customAttributes?: Record<string, unknown>) => void;
  setUserId?: (userId: string) => void;
  setPageViewName?: (name: string) => void;
};

@Injectable({providedIn: 'root'})
export class NewRelicService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private agent: BrowserAgentInstance | null = null;
  private initialized = false;
  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  async initFromBackend(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    try {
      const config = await firstValueFrom(
        this.http.get<PublicObservabilityConfig>(`${environment.apiUrl}/api/public/observability-config`)
      );
      if (!config?.newRelicBrowserEnabled) {
        return;
      }
      await this.startBrowserAgent(config);
      this.enabled = true;
      this.trackRouteChanges();
    } catch (error) {
      if (!environment.production) {
        console.warn('New Relic browser agent not initialized', error);
      }
    }
  }

  log(message: string, level: 'debug' | 'error' | 'info' | 'trace' | 'warn' = 'info'): void {
    this.agent?.log?.(message, {level});
  }

  noticeError(error: Error, customAttributes?: Record<string, unknown>): void {
    this.agent?.noticeError?.(error, customAttributes);
  }

  setUserId(userId: string): void {
    if (!userId?.trim()) {
      return;
    }
    this.agent?.setUserId?.(userId.trim());
  }

  private trackRouteChanges(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      const navigation = event as NavigationEnd;
      const path = navigation.urlAfterRedirects || navigation.url;
      this.agent?.setPageViewName?.(path);
    });
  }

  private async startBrowserAgent(config: PublicObservabilityConfig): Promise<void> {
    const accountId = config.accountId?.trim();
    const applicationId = config.applicationId?.trim();
    const licenseKey = config.licenseKey?.trim();
    if (!accountId || !applicationId || !licenseKey) {
      return;
    }

    const [
      {Agent},
      {Ajax},
      {JSErrors},
      {Logging},
      {Metrics},
      {PageViewEvent},
      {PageViewTiming},
      {SoftNav}
    ] = await Promise.all([
      import('@newrelic/browser-agent/loaders/agent'),
      import('@newrelic/browser-agent/features/ajax'),
      import('@newrelic/browser-agent/features/jserrors'),
      import('@newrelic/browser-agent/features/logging'),
      import('@newrelic/browser-agent/features/metrics'),
      import('@newrelic/browser-agent/features/page_view_event'),
      import('@newrelic/browser-agent/features/page_view_timing'),
      import('@newrelic/browser-agent/features/soft_navigations')
    ]);

    const trustKey = config.trustKey?.trim() || accountId;
    const options = {
      init: {
        distributed_tracing: {enabled: true},
        privacy: {cookies_enabled: true},
        ajax: {deny_list: [] as string[]},
        logging: {enabled: true}
      },
      info: {
        licenseKey,
        applicationID: applicationId,
        accountID: accountId,
        trustKey
      },
      loader_config: {
        accountID: accountId,
        trustKey,
        agentID: applicationId,
        licenseKey,
        applicationID: applicationId
      },
      features: [Ajax, JSErrors, Logging, Metrics, PageViewEvent, PageViewTiming, SoftNav]
    };

    this.agent = new Agent(options) as BrowserAgentInstance;
  }
}

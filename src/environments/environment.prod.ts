import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // same-origin (proxied by Caddy to the gateway container)
  apiUrl: '',
  apiAuth: '',
  loginBackendStatus: {
    enabled: true,
    pollIntervalMs: 60_000,
    activePollIntervalMs: 5_000,
    healthPath: '/api/public/health',
    wakePath: '/actuator/health/liveness',
    requestTimeoutMs: 8_000
  }
};
export const AppConfig = {
  authentication: {
    authorization: `${environment.apiAuth}/oauth2/token`,
    client_id: 'oosm-client'
  }
};

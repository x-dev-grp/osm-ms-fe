import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // same-origin (proxied by Caddy to the gateway container)
  apiUrl: '',
  apiAuth: '',
  /** Public OneSignal App ID (safe in the browser). REST API key stays on the backend only. */
  oneSignalAppId: '937e982c-31ae-46c4-8537-030deed9b2aa'
};
export const AppConfig = {
  authentication: {
    authorization: `${environment.apiAuth}/oauth2/token`,
    client_id: 'oosm-client'
  }
};

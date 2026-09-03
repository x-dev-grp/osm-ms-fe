import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // same-origin (proxied by Caddy to the gateway container)
  apiUrl: '',
  apiAuth: '',
  /** Public Firebase web config (safe in browser). Service-account private key stays on backend only. */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    vapidKey: ''
  }
};
export const AppConfig = {
  authentication: {
    authorization: `${environment.apiAuth}/oauth2/token`,
    client_id: 'oosm-client'
  }
};

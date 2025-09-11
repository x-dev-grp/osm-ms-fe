import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // same-origin (proxied by Caddy to the gateway container)
  apiUrl: '/api',
  apiAuth: ''
};
export const AppConfig={

  authentication: {
    authorization:`${environment.apiAuth}/oauth2/token`,
    authorization_header:"Basic b3NtLWNsaWVudDpYN2tQOW1OMnZROHJUNHdZNnpBMWJDM2RFNWZHOGhKOQ=="

  }
}

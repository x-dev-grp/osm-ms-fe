import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  // same-origin (proxied by Caddy to the gateway container)
  apiUrl: '',
  apiAuth: ''
};
export const AppConfig={

  authentication: {
    authorization:`${environment.apiAuth}/oauth2/token`,
    client_id: 'osm-client'
  }
}

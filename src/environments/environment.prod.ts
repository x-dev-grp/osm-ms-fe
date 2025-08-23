import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'https://osm-gateway.onrender.com',
  // apiUrl: 'http://localhost:8084'

};
export const AppConfig={

  authentication: {
    authorization:`${environment.apiUrl}/oauth2/token`,
    authorization_header:"Basic b3NtLWNsaWVudDpYN2tQOW1OMnZROHJUNHdZNnpBMWJDM2RFNWZHOGhKOQ=="

  }
}

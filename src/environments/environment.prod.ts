import packageInfo from '../../package.json';

export const environment = {
   production: true,
  apiUrl: 'https://osm-gateway.onrender.com'
};
export const AppConfig={

  authentication: {
    authorization:`${environment.apiUrl}/oauth2/token`,
    authorization_header:"Basic b3NtLWNsaWVudDpYN2tQOW1OMnZROHJUNHdZNnpBMWJDM2RFNWZHOGhKOQ=="

  }
}

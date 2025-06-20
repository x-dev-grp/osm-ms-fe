import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'https://mock-data-api-nextjs.vercel.app/'
};
export const AppConfig={

  authentication: {
    authorization:`/oauth2/token`,
    authorization_header:"Basic b3NtLWNsaWVudDpYN2tQOW1OMnZROHJUNHdZNnpBMWJDM2RFNWZHOGhKOQ=="

  }
}

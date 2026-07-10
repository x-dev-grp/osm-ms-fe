// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  apiUrl: '',
  /** Public OneSignal App ID (safe in the browser). REST API key stays on the backend only. */
  oneSignalAppId: '937e982c-31ae-46c4-8537-030deed9b2aa'
};

export const AppConfig={

  authentication: {
    authorization:`${environment.apiUrl}/oauth2/token`,
    client_id: 'oosm-client'
  }
}
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */

export interface QrCodeRequest {
  payloadType: string;
  uuids: string[];
  encrypted: boolean;
}

export interface QrCodeInfo {
  publicCode: string;
  qrUrl: string;
  qrImageBase64: string;
}

export interface QrResolveResponse {
  entityType: string;
  publicCode: string;
  entityId: string;
  label: string;
  status: string;
  mobileRoute: string;
  data?: unknown;
}

export interface QrCodeResponse {
  qrText: string;
  qrImageBase64: string;
  encrypted: boolean;
  payloadType: string;
  payloadMode: string;
}

export interface QrCodeRequest {
  payloadType: string;
  uuids: string[];
  encrypted: boolean;
}

export interface QrCodeResponse {
  qrText: string;
  qrImageBase64: string;
  encrypted: boolean;
  payloadType: string;
  payloadMode: string;
}

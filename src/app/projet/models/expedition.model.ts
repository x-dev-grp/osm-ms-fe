export enum ExpeditionStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  VALIDATED = 'VALIDATED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export interface ExpeditionLineDto {
  id: string;
  ofId?: string;
  ofCode?: string;
  articleId?: string;
  articleName?: string;
  quantity: number;
  volume?: number;
  lotNumber?: string;
  unit?: string;
}

export interface ExpeditionDto {
  id: string;
  expeditionNumber: string;
  projetId: string;
  projetCode?: string;
  clientId: string;
  status: ExpeditionStatus;
  destination?: string;
  plannedShipDate?: string;
  validatedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  notes?: string;
  totalQuantity?: number;
  totalVolume?: number;

  /* Transport (merged from shipping) */
  carrierName?: string;
  driverName?: string;
  truckNumber?: string;
  trackingNumber?: string;
  incoterm?: string;

  createdDate?: string;
  lastModifiedDate?: string;
  publicCode?: string;
  qrImageBase64?: string;
  traceabilitySnapshotJson?: string;
  lines: ExpeditionLineDto[];
}

export interface ExpeditionCreateRequest {
  projetId: string;
  destination?: string;
  plannedShipDate?: string;
  notes?: string;
}

export interface ExpeditionUpdateRequest {
  destination?: string;
  plannedShipDate?: string;
  notes?: string;
  carrierName?: string;
  driverName?: string;
  truckNumber?: string;
  trackingNumber?: string;
  incoterm?: string;
}

export interface ExpeditionLineCreateRequest {
  ofId?: string;
  articleId?: string;
  quantity: number;
  volume?: number;
  lotNumber?: string;
  unit?: string;
}

export interface ExpeditionActionRequest {
  comment?: string;
  location?: string;
}

export interface ResolveResponse {
  entityType: string;
  publicCode: string;
  entityId: string;
  label?: string;
  status?: string;
  webRoute?: string;
}

export interface AuditDto {
  entityName: string;
  id: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  serviceSource?: string;
  revision?: number;
  revisionType?: string;
}

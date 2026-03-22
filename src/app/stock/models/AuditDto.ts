export interface AuditDto {
  entityName: string;
  id: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export interface AuditFilters {
  dateDebut: string;
  dateFin: string;
  typeAction: string;
  utilisateur: string;
  entityName: string;
}


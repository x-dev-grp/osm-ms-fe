export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type SupportTicketScope = 'mine' | 'tenant' | 'all';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  pageUrl?: string | null;
  reporterUserId?: string;
  reporterUsername?: string;
  reporterDisplayName?: string;
  tenantName?: string | null;
  tenantId?: string;
  adminNote?: string | null;
  createdDate?: string;
  resolvedAt?: string | null;
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
  pageUrl?: string;
}

export interface UpdateSupportTicketPayload {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  adminNote?: string;
}

export interface SupportTicketPageResponse {
  success: boolean;
  message?: string;
  data: SupportTicket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SupportTicketSingleResponse {
  success: boolean;
  message?: string;
  data: SupportTicket;
}

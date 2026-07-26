export interface LeaveTypeConfig {
  id?: string;
  code?: string;
  nameFr: string;
  nameAr?: string;
  paid?: boolean;
  requiresApproval?: boolean;
  requiresDocument?: boolean;
  impactsPayroll?: boolean;
  annualAllowance?: number;
  active?: boolean;
}

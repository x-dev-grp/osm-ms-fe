export type QcEntryContext =
  | 'RECEPTION_OLIVE'
  | 'RECEPTION_OIL'
  | 'OIL_FROM_OLIVE'
  | 'FILTRATION';

export interface QcChecklistItem {
  ruleKey: string;
  ruleName: string;
  passed: boolean | null;
  message?: string;
}

export interface QcChecklistSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  percent: number;
  items: QcChecklistItem[];
  suggestedGrade?: string | null;
}

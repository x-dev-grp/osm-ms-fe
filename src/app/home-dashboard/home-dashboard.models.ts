export type HomeModuleId = 'reception' | 'finance' | 'storage' | 'inventory' | 'conditioning';

export interface HomeMetric {
  labelKey: string;
  value: number | string;
  attention?: boolean;
}

export interface HomeModuleSection {
  id: HomeModuleId;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  accentClass: string;
  route: string;
  metrics: HomeMetric[];
  attentionCount: number;
  visible: boolean;
  loading: boolean;
  error: boolean;
}

export interface HomeQuickLink {
  titleKey: string;
  hintKey: string;
  icon: string;
  route: string;
  accentClass: string;
}

export interface HomeDashboardSnapshot {
  sections: HomeModuleSection[];
  attentionTotal: number;
}

export type LabelCompositionSource = 'measured' | 'estimated';

export type LabelNutritionFootnoteCode = 'approx' | 'nmt' | 'min';

export interface LabelQcEntry {
  key: string;
  label: string;
  value: string;
}

export interface LabelCompositionEntry {
  key: string;
  label: string;
  value: string;
  per100ml?: string;
  source: LabelCompositionSource;
}

export interface LabelNutritionTableColumns {
  parameter: string;
  per100: string;
  perServing: string;
  rda: string;
}

export interface LabelNutritionRow {
  key: string;
  parameter: string;
  per100: string;
  perServing: string;
  rdaPercent?: string;
  source: LabelCompositionSource;
  footnote?: LabelNutritionFootnoteCode;
}

export interface LabelNutritionTable {
  title: string;
  servingSizeLabel: string;
  servingSize: string;
  servingsPerPackLabel: string;
  servingsPerPack: string;
  basis: '100ml' | '100g';
  columns: LabelNutritionTableColumns;
  rows: LabelNutritionRow[];
  footnotes: string[];
}

export interface LabelQcCompositionBundle {
  qualityControls: LabelQcEntry[];
  compositionEstimate: LabelCompositionEntry[];
  nutritionTable: LabelNutritionTable;
  postFiltrationQualityControls: Record<string, string>;
}

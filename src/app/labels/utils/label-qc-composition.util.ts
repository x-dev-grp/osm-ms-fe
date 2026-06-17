import { ProductionGenealogy } from '../../shared/models/production-genealogy.model';
import { LabelContentDto } from '../models/label.model';
import { LabelLanguage } from '../models/label.model';
import {
  LabelCompositionEntry,
  LabelCompositionSource,
  LabelNutritionRow,
  LabelNutritionTable,
  LabelQcCompositionBundle,
  LabelQcEntry
} from '../models/label-qc-composition.model';

const COMPOSITION_KEY_PATTERNS: { key: string; label: string; patterns: string[] }[] = [
  { key: 'lipides', label: 'Lipides', patterns: ['lipide', 'lipid', 'gras', 'fat', 'matiere grasse'] },
  { key: 'acides_gras_satures', label: 'Acides gras saturés', patterns: ['sature', 'saturated', 'ag sature'] },
  { key: 'acides_gras_trans', label: 'Acides gras trans', patterns: ['trans', 'acide gras trans'] },
  { key: 'acides_gras_mono', label: 'Acides gras monoinsaturés', patterns: ['monoinsature', 'monounsaturated', 'ag mono', 'mufa'] },
  { key: 'acides_gras_poly', label: 'Acides gras polyinsaturés', patterns: ['polyinsature', 'polyunsaturated', 'ag poly', 'pufa'] },
  { key: 'omega_3', label: 'Acides gras Oméga-3', patterns: ['omega 3', 'omega-3', 'omega3', 'oméga 3'] },
  { key: 'omega_6', label: 'Acides gras Oméga-6', patterns: ['omega 6', 'omega-6', 'omega6', 'oméga 6'] },
  { key: 'cholesterol', label: 'Cholestérol', patterns: ['cholesterol', 'cholestérol'] },
  { key: 'vitamine_e', label: 'Vitamine E', patterns: ['vitamine e', 'vitamin e', 'tocopherol', 'alpha tocopherol'] },
  { key: 'vitamine_a', label: 'Vitamine A', patterns: ['vitamine a', 'vitamin a', 'retinol'] },
  { key: 'vitamine_d', label: 'Vitamine D', patterns: ['vitamine d', 'vitamin d'] },
  { key: 'vitamine_k', label: 'Vitamine K', patterns: ['vitamine k', 'vitamin k'] },
  { key: 'polyphenols', label: 'Polyphénols', patterns: ['polyphenol', 'poly phenol'] },
  { key: 'energie', label: 'Énergie', patterns: ['energie', 'energy', 'calorie', 'kcal', 'kj'] },
  { key: 'glucides', label: 'Glucides', patterns: ['glucide', 'carbohydrate', 'carb'] },
  { key: 'proteines', label: 'Protéines', patterns: ['proteine', 'protein'] },
  { key: 'sel', label: 'Sodium', patterns: ['sel', 'sodium', 'salt'] }
];

const DEFAULT_SERVING_ML = 15;

/** Reference values for olive oil — per 100 ml (Tunisia compliance defaults). */
const REFERENCE_COMPOSITION_PER_100ML: Omit<LabelCompositionEntry, 'source'>[] = [
  { key: 'energie', label: 'Énergie', value: '824 kcal / 3389 kJ', per100ml: '824 kcal / 3389 kJ' },
  { key: 'proteines', label: 'Protéines', value: '0 g', per100ml: '0 g' },
  { key: 'glucides', label: 'Glucides', value: '0 g', per100ml: '0 g' },
  { key: 'lipides', label: 'Matières grasses', value: '91,6 g', per100ml: '91,6 g' },
  { key: 'acides_gras_satures', label: 'dont acides gras saturés', value: '13,8 g', per100ml: '13,8 g' },
  { key: 'acides_gras_trans', label: 'dont acides gras trans', value: '0 g', per100ml: '0 g' },
  { key: 'cholesterol', label: 'Cholestérol', value: '0 mg', per100ml: '0 mg' },
  { key: 'sel', label: 'Sel', value: '0 g', per100ml: '0 g' }
];

const NUTRITION_ROW_ORDER: { key: string; rdaKey?: string; footnote?: 'nmt' | 'min' }[] = [
  { key: 'energie', rdaKey: 'energie_kcal' },
  { key: 'proteines', rdaKey: 'proteines' },
  { key: 'glucides', rdaKey: 'glucides' },
  { key: 'lipides', rdaKey: 'lipides' },
  { key: 'acides_gras_satures', rdaKey: 'acides_gras_satures' },
  { key: 'acides_gras_trans', footnote: 'nmt' },
  { key: 'cholesterol', footnote: 'nmt' },
  { key: 'sel', footnote: 'nmt' },
  { key: 'omega_3' },
  { key: 'omega_6' },
  { key: 'acides_gras_mono' },
  { key: 'acides_gras_poly' },
  { key: 'vitamine_e', rdaKey: 'vitamine_e' },
  { key: 'vitamine_a' },
  { key: 'vitamine_d' },
  { key: 'vitamine_k' }
];

const RDA_REFERENCES: Record<string, number> = {
  energie_kcal: 2000,
  lipides: 70,
  acides_gras_satures: 20,
  glucides: 260,
  proteines: 50,
  vitamine_e: 12
};

const NUTRITION_LABELS: Record<
  LabelLanguage | 'default',
  {
    title: string;
    servingSize: string;
    servingsPerPack: string;
    columns: { parameter: string; per100: string; perServing: string; rda: string };
    rowLabels: Record<string, string>;
    footnotes: { approx: string; nmt: string; min: string; measured: string; estimated: string };
  }
> = {
  FR: {
    title: 'Informations nutritionnelles (valeurs approximatives)',
    servingSize: 'Taille de portion',
    servingsPerPack: 'Portions par emballage',
    columns: {
      parameter: 'Paramètre',
      per100: 'Pour 100 ml',
      perServing: 'Par portion',
      rda: '% AR par portion'
    },
    rowLabels: {
      energie: 'Énergie',
      proteines: 'Protéines',
      glucides: 'Glucides',
      lipides: 'Matières grasses totales',
      acides_gras_satures: 'dont acides gras saturés',
      acides_gras_trans: 'dont acides gras trans',
      cholesterol: 'Cholestérol',
      sel: 'Sodium',
      omega_3: 'Acides gras Oméga-3',
      omega_6: 'Acides gras Oméga-6',
      acides_gras_mono: 'AG monoinsaturés (MUFA)',
      acides_gras_poly: 'AG polyinsaturés (PUFA)',
      vitamine_e: 'Vitamine E',
      vitamine_a: 'Vitamine A',
      vitamine_d: 'Vitamine D',
      vitamine_k: 'Vitamine K'
    },
    footnotes: {
      approx: '* Valeurs approximatives lorsque non mesurées en laboratoire.',
      nmt: 'NMT = Ne dépasse pas.',
      min: 'Min = Valeur minimale.',
      measured: 'Mesuré',
      estimated: 'Estimé'
    }
  },
  EN: {
    title: 'Nutritional Information (Approximate Values)',
    servingSize: 'Serving size',
    servingsPerPack: 'Servings per pack',
    columns: {
      parameter: 'Parameter',
      per100: 'Per 100 ml',
      perServing: 'Per serving',
      rda: '% RDI per serve'
    },
    rowLabels: {
      energie: 'Energy',
      proteines: 'Protein',
      glucides: 'Carbohydrate',
      lipides: 'Total Fat',
      acides_gras_satures: 'Saturated Fat',
      acides_gras_trans: 'Trans Fat',
      cholesterol: 'Cholesterol',
      sel: 'Sodium',
      omega_3: 'Omega-3 fatty acids',
      omega_6: 'Omega-6 fatty acids',
      acides_gras_mono: 'Monounsaturated Fat (MUFA)',
      acides_gras_poly: 'Polyunsaturated Fat (PUFA)',
      vitamine_e: 'Vitamin E',
      vitamine_a: 'Vitamin A',
      vitamine_d: 'Vitamin D',
      vitamine_k: 'Vitamin K'
    },
    footnotes: {
      approx: '* Approximate values when not measured in laboratory.',
      nmt: 'NMT = Not more than.',
      min: 'Min = Minimum value.',
      measured: 'Measured',
      estimated: 'Estimated'
    }
  },
  AR: {
    title: 'المعلومات الغذائية (قيم تقريبية)',
    servingSize: 'حجم الحصة',
    servingsPerPack: 'عدد الحصص في العبوة',
    columns: {
      parameter: 'المعيار',
      per100: 'لكل 100 مل',
      perServing: 'لكل حصة',
      rda: '% من الاحتياج اليومي'
    },
    rowLabels: {
      energie: 'الطاقة',
      proteines: 'البروتين',
      glucides: 'الكربوهيدرات',
      lipides: 'إجمالي الدهون',
      acides_gras_satures: 'الدهون المشبعة',
      acides_gras_trans: 'الدهون المتحولة',
      cholesterol: 'الكوليسترول',
      sel: 'الصوديوم',
      omega_3: 'أوميغا 3',
      omega_6: 'أوميغا 6',
      acides_gras_mono: 'الدهون أحادية غير المشبعة',
      acides_gras_poly: 'الدهون متعددة غير المشبعة',
      vitamine_e: 'فيتامين E',
      vitamine_a: 'فيتامين A',
      vitamine_d: 'فيتامين D',
      vitamine_k: 'فيتامين K'
    },
    footnotes: {
      approx: '* قيم تقريبية عندما لا تُقاس في المختبر.',
      nmt: 'NMT = لا يتجاوز.',
      min: 'Min = قيمة دنيا.',
      measured: 'مقاس',
      estimated: 'مقدر'
    }
  },
  default: {
    title: 'Informations nutritionnelles (valeurs approximatives)',
    servingSize: 'Taille de portion',
    servingsPerPack: 'Portions par emballage',
    columns: {
      parameter: 'Paramètre',
      per100: 'Pour 100 ml',
      perServing: 'Par portion',
      rda: '% AR par portion'
    },
    rowLabels: {},
    footnotes: {
      approx: '* Valeurs approximatives lorsque non mesurées en laboratoire.',
      nmt: 'NMT = Ne dépasse pas.',
      min: 'Min = Valeur minimale.',
      measured: 'Mesuré',
      estimated: 'Estimé'
    }
  }
};

/** Default conservation text when no value is set on the label. */
export const DEFAULT_LABEL_STORAGE_CONDITIONS =
  'A conserver a l\'abri de la lumiere et de la chaleur';

export function resolveStorageConditionsDisplay(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_LABEL_STORAGE_CONDITIONS;
}

export function formatQualityControlsDisplay(
  controls: Record<string, string> | null | undefined
): string {
  if (!controls) {
    return '';
  }

  return Object.entries(controls)
    .filter(([key, value]) => !!String(key || '').trim() && !!String(value || '').trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ');
}

export function filterNonCompositionQualityControls(
  controls: Record<string, string> | null | undefined
): Record<string, string> {
  if (!controls) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(controls).filter(([key]) => !isCompositionQcKey(key))
  );
}

export function resolveSensoryProfileDisplay(
  controls: Record<string, string> | null | undefined,
  sensoryProfile?: string | null
): string {
  const qcText = formatQualityControlsDisplay(filterNonCompositionQualityControls(controls));
  if (qcText) {
    return qcText;
  }

  return sensoryProfile?.trim() || '';
}

export function hasPostFiltrationQualityControls(
  controls: Record<string, string> | null | undefined
): boolean {
  return !!controls && Object.keys(controls).length > 0;
}

export function hasSensoryQualityControls(
  controls: Record<string, string> | null | undefined
): boolean {
  return Object.keys(filterNonCompositionQualityControls(controls)).length > 0;
}

export function normalizeQcKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isCompositionQcKey(key: string): boolean {
  const normalized = normalizeQcKey(key);
  return COMPOSITION_KEY_PATTERNS.some((entry) =>
    entry.patterns.some((pattern) => normalized.includes(normalizeQcKey(pattern)))
  );
}

export function resolvePostFiltrationQualityControls(
  genealogy?: ProductionGenealogy | null,
  label?: LabelContentDto | null,
  explicitControls?: Record<string, string> | null
): Record<string, string> {
  if (explicitControls && Object.keys(explicitControls).length > 0) {
    return explicitControls;
  }

  const fromPayload = extractControlsFromPayloadJson(label?.finalPayloadJson);
  if (Object.keys(fromPayload).length > 0) {
    return fromPayload;
  }

  const fromSnapshots = extractControlsFromSourceSnapshots(label?.sourceSnapshots);
  if (Object.keys(fromSnapshots).length > 0) {
    return fromSnapshots;
  }

  return resolveControlsFromGenealogy(genealogy);
}

function extractControlsFromPayloadJson(finalPayloadJson?: string | null): Record<string, string> {
  if (!finalPayloadJson?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(finalPayloadJson) as Record<string, unknown>;
    return toStringRecord(parsed['postFiltrationQualityControls']);
  } catch {
    return {};
  }
}

function extractControlsFromSourceSnapshots(
  sourceSnapshots?: LabelContentDto['sourceSnapshots']
): Record<string, string> {
  const snapshot = sourceSnapshots?.find((item) => item.sourceType === 'FILTERED_LOT')?.snapshotJson;
  if (!snapshot?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(snapshot) as Record<string, unknown>;
    const direct = toStringRecord(parsed['filteredQualityControls']);
    if (Object.keys(direct).length > 0) {
      return direct;
    }

    const genealogy = parsed['genealogy'];
    if (genealogy && typeof genealogy === 'object') {
      return resolveControlsFromGenealogy(genealogy as ProductionGenealogy);
    }
  } catch {
    return {};
  }

  return {};
}

function resolveControlsFromGenealogy(genealogy?: ProductionGenealogy | null): Record<string, string> {
  const direct = genealogy?.filteredQualityControls;
  if (direct && Object.keys(direct).length > 0) {
    return direct;
  }

  const fromStep = genealogy?.filtrations
    ?.map((step) => step.qualityControls)
    .find((controls): controls is Record<string, string> => !!controls && Object.keys(controls).length > 0);

  return fromStep || {};
}

function toStringRecord(source: unknown): Record<string, string> {
  if (!source || typeof source !== 'object') {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    const text = String(value ?? '').trim();
    if (key.trim() && text) {
      result[key.trim()] = text;
    }
  }
  return result;
}

function matchCompositionDefinition(key: string): (typeof COMPOSITION_KEY_PATTERNS)[number] | undefined {
  const normalized = normalizeQcKey(key);
  return COMPOSITION_KEY_PATTERNS.find((entry) =>
    entry.patterns.some((pattern) => normalized.includes(normalizeQcKey(pattern)))
  );
}

function parseVolumeMl(netQuantity?: string | null): number | null {
  if (!netQuantity?.trim()) {
    return null;
  }

  const match = netQuantity.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|litre|liter)?/i);
  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1].replace(',', '.'));
  if (Number.isNaN(amount) || amount <= 0) {
    return null;
  }

  const unit = (match[2] || 'ml').toLowerCase();
  return unit.startsWith('l') ? amount * 1000 : amount;
}

function scalePer100mlValue(value: string, volumeMl: number | null): string | undefined {
  if (!volumeMl || volumeMl === 100) {
    return value;
  }

  const numeric = value.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!numeric) {
    return undefined;
  }

  const amount = Number.parseFloat(numeric[1].replace(',', '.'));
  const unit = numeric[2]?.trim() || '';
  if (Number.isNaN(amount)) {
    return undefined;
  }

  const scaled = (amount / 100) * volumeMl;
  return formatAmount(scaled, unit);
}

function formatAmount(amount: number, unit: string): string {
  const formatted = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function resolveServingMl(volumeMl: number | null): number {
  if (!volumeMl || volumeMl <= 0) {
    return DEFAULT_SERVING_ML;
  }

  if (volumeMl <= 30) {
    return volumeMl;
  }

  return DEFAULT_SERVING_ML;
}

function formatServingsPerPack(volumeMl: number | null, servingMl: number): string {
  if (!volumeMl || volumeMl <= 0 || servingMl <= 0) {
    return '-';
  }

  const servings = volumeMl / servingMl;
  return servings % 1 === 0 ? servings.toFixed(0) : servings.toFixed(1);
}

function parseNumericAmount(value: string): { amount: number; unit: string } | null {
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1].replace(',', '.'));
  const unit = match[2]?.trim() || '';
  if (Number.isNaN(amount)) {
    return null;
  }

  return { amount, unit };
}

function parseEnergyAmount(value: string): { kcal: number; kj: number } | null {
  const kcalMatch = value.match(/(\d+(?:[.,]\d+)?)\s*kcal/i);
  const kjMatch = value.match(/(\d+(?:[.,]\d+)?)\s*kJ/i);
  if (!kcalMatch && !kjMatch) {
    return null;
  }

  return {
    kcal: kcalMatch ? Number.parseFloat(kcalMatch[1].replace(',', '.')) : 0,
    kj: kjMatch ? Number.parseFloat(kjMatch[1].replace(',', '.')) : 0
  };
}

function scalePerServingFromPer100(value: string, servingMl: number): string {
  const energy = parseEnergyAmount(value);
  if (energy) {
    const factor = servingMl / 100;
    const parts: string[] = [];
    if (energy.kcal > 0) {
      parts.push(formatAmount(energy.kcal * factor, 'kcal'));
    }
    if (energy.kj > 0) {
      parts.push(formatAmount(energy.kj * factor, 'kJ'));
    }
    return parts.join(' / ');
  }

  const parsed = parseNumericAmount(value);
  if (!parsed) {
    return value;
  }

  const scaled = parsed.amount * (servingMl / 100);
  return formatAmount(scaled, parsed.unit);
}

function computeRdaPercent(value: string, rdaKey?: string): string | undefined {
  if (!rdaKey || !RDA_REFERENCES[rdaKey]) {
    return undefined;
  }

  const reference = RDA_REFERENCES[rdaKey];
  if (rdaKey === 'energie_kcal') {
    const energy = parseEnergyAmount(value);
    if (!energy?.kcal) {
      return undefined;
    }
    const percent = (energy.kcal / reference) * 100;
    return `${percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1)}%`;
  }

  const parsed = parseNumericAmount(value);
  if (!parsed) {
    return undefined;
  }

  const percent = (parsed.amount / reference) * 100;
  return `${percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1)}%`;
}

function resolveNutritionLabels(language?: LabelLanguage | string | null) {
  const key = (language || 'FR').toString().toUpperCase() as LabelLanguage;
  return NUTRITION_LABELS[key] || NUTRITION_LABELS.FR;
}

export function buildLabelNutritionTable(
  compositionEstimate: LabelCompositionEntry[],
  netQuantity?: string | null,
  language?: LabelLanguage | string | null
): LabelNutritionTable {
  const labels = resolveNutritionLabels(language);
  const volumeMl = parseVolumeMl(netQuantity);
  const servingMl = resolveServingMl(volumeMl);
  const compositionByKey = new Map(compositionEstimate.map((entry) => [entry.key, entry]));
  const rows: LabelNutritionRow[] = [];

  for (const rowDef of NUTRITION_ROW_ORDER) {
    const entry = compositionByKey.get(rowDef.key);
    if (!entry) {
      continue;
    }

    const per100 = entry.per100ml || entry.value;
    const perServing = scalePerServingFromPer100(per100, servingMl);
    const parameter = labels.rowLabels[rowDef.key] || entry.label;

    rows.push({
      key: rowDef.key,
      parameter,
      per100,
      perServing,
      rdaPercent: computeRdaPercent(perServing, rowDef.rdaKey),
      source: entry.source,
      footnote: rowDef.footnote
    });
  }

  const footnotes = [labels.footnotes.approx];
  if (rows.some((row) => row.footnote === 'nmt')) {
    footnotes.push(labels.footnotes.nmt);
  }
  if (rows.some((row) => row.footnote === 'min')) {
    footnotes.push(labels.footnotes.min);
  }

  return {
    title: labels.title,
    servingSizeLabel: labels.servingSize,
    servingSize: `${servingMl} ml`,
    servingsPerPackLabel: labels.servingsPerPack,
    servingsPerPack: formatServingsPerPack(volumeMl, servingMl),
    basis: '100ml',
    columns: labels.columns,
    rows,
    footnotes
  };
}

export function nutritionSourceLabel(
  source: LabelCompositionSource,
  language?: LabelLanguage | string | null
): string {
  const labels = resolveNutritionLabels(language);
  return source === 'measured' ? labels.footnotes.measured : labels.footnotes.estimated;
}

export function buildLabelQcCompositionBundle(
  controls: Record<string, string> | null | undefined,
  netQuantity?: string | null,
  productDensity?: number | null,
  language?: LabelLanguage | string | null
): LabelQcCompositionBundle {
  const postFiltrationQualityControls = controls || {};
  const volumeMl = parseVolumeMl(netQuantity);
  const qualityControls: LabelQcEntry[] = [];
  const measuredComposition = new Map<string, LabelCompositionEntry>();

  for (const [key, value] of Object.entries(postFiltrationQualityControls)) {
    const compositionDef = matchCompositionDefinition(key);
    if (compositionDef) {
      measuredComposition.set(compositionDef.key, {
        key: compositionDef.key,
        label: compositionDef.label,
        value,
        per100ml: value,
        source: 'measured'
      });
      continue;
    }

    qualityControls.push({ key, label: key, value });
  }

  const compositionEstimate: LabelCompositionEntry[] = [];

  for (const reference of REFERENCE_COMPOSITION_PER_100ML) {
    const measured = measuredComposition.get(reference.key);
    if (measured) {
      compositionEstimate.push({
        ...measured,
        per100ml: measured.per100ml || measured.value,
        value: scalePer100mlValue(measured.value, volumeMl) || measured.value
      });
      continue;
    }

    compositionEstimate.push({
      ...reference,
      value: scalePer100mlValue(reference.value, volumeMl) || reference.value,
      source: 'estimated'
    });
  }

  for (const [key, entry] of measuredComposition.entries()) {
    if (compositionEstimate.some((item) => item.key === key)) {
      continue;
    }
    compositionEstimate.push({
      ...entry,
      value: scalePer100mlValue(entry.value, volumeMl) || entry.value
    });
  }

  if (productDensity && volumeMl) {
    const massG = volumeMl * productDensity;
    compositionEstimate.unshift({
      key: 'masse_nette',
      label: 'Masse nette estimée',
      value: `${massG % 1 === 0 ? massG.toFixed(0) : massG.toFixed(1)} g`,
      source: 'estimated'
    });
  }

  const nutritionTable = buildLabelNutritionTable(compositionEstimate, netQuantity, language);

  return {
    qualityControls,
    compositionEstimate,
    nutritionTable,
    postFiltrationQualityControls
  };
}

export function applyCompositionOverrides(
  bundle: LabelQcCompositionBundle,
  overrides: Record<string, string> | null | undefined,
  netQuantity?: string | null,
  language?: LabelLanguage | string | null
): LabelQcCompositionBundle {
  if (!overrides || Object.keys(overrides).length === 0) {
    return bundle;
  }

  const volumeMl = parseVolumeMl(netQuantity);
  const compositionEstimate = bundle.compositionEstimate.map((entry) => {
    const override = overrides[entry.key]?.trim();
    if (!override) {
      return entry;
    }

    return {
      ...entry,
      per100ml: override,
      value: scalePer100mlValue(override, volumeMl) || override,
      source: 'measured' as LabelCompositionSource
    };
  });

  return {
    ...bundle,
    compositionEstimate,
    nutritionTable: buildLabelNutritionTable(compositionEstimate, netQuantity, language)
  };
}

export function compositionSourceLabel(source: LabelCompositionSource): string {
  return nutritionSourceLabel(source, 'FR');
}

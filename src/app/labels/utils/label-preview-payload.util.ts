import { Certification } from '../models/certification.model';
import { LabelCategory, LabelClaimType, LabelContentDto, LabelLanguage } from '../models/label.model';
import { LabelPreviewViewModel } from '../models/label-preview.model';
import { ProductionGenealogy } from '../../shared/models/production-genealogy.model';
import { showEvooLegalStatement } from './label-compliance.util';
import {
  applyCompositionOverrides,
  buildLabelQcCompositionBundle,
  hasSensoryQualityControls,
  resolvePostFiltrationQualityControls,
  resolveSensoryProfileDisplay
} from './label-qc-composition.util';
import {
  buildLocalizedEvooStatement,
  buildLocalizedIngredientDeclaration,
  buildLocalizedOriginLine,
  buildLocalizedProductName,
  resolveLocalizedOrigin,
  resolveLocalizedStorageConditions
} from './label-preview-localization.util';

export interface LabelFormPreviewValues {
  language?: LabelLanguage | null;
  labelCategory?: LabelCategory | null;
  lotNumber?: string | null;
  legalDenomination?: string | null;
  originCountry?: string | null;
  netQuantity?: string | null;
  qualityGrade?: string | null;
  variety?: string | null;
  bestBeforeDate?: string | null;
  packagingDate?: string | null;
  claimTypes?: LabelClaimType[] | null;
  certifications?: string[] | null;
  extractionMethod?: string | null;
  storageConditions?: string | null;
  sensoryProfile?: string | null;
  responsibleName?: string | null;
  responsibleAddress?: string | null;
  ingredientDeclaration?: string | null;
  ean13?: string | null;
  harvestYear?: string | null;
  acidityLevel?: string | null;
}

export interface BuildLabelPreviewPayloadOptions {
  form: LabelFormPreviewValues;
  currentLabel?: LabelContentDto | null;
  certifications: Certification[];
  brandName?: string;
  brandLogoData?: string;
  brandLogoContentType?: string;
  postFiltrationQualityControls?: Record<string, string> | null;
  compositionOverrides?: Record<string, string> | null;
  previewLanguage?: LabelLanguage | null;
  genealogy?: ProductionGenealogy | null;
  productDensity?: number | null;
  resolveQualityLabel: (value: string | null | undefined) => string;
  resolveVarietyLabel: (value: string | null | undefined) => string;
  resolveClaimLabel: (value: LabelClaimType | string) => string;
}

function resolveBrandName(brandName: string | undefined, form: LabelFormPreviewValues, currentLabel?: LabelContentDto | null): string {
  return brandName?.trim() || form.responsibleName?.trim() || currentLabel?.responsibleName?.trim() || 'Entreprise';
}

function buildQcBundle(options: BuildLabelPreviewPayloadOptions) {
  const { form, currentLabel } = options;
  const resolvedControls = resolvePostFiltrationQualityControls(options.genealogy, currentLabel, options.postFiltrationQualityControls);
  const language = options.previewLanguage || form.language || currentLabel?.language || 'FR';
  const baseBundle = buildLabelQcCompositionBundle(resolvedControls, form.netQuantity, options.productDensity, language);

  return applyCompositionOverrides(baseBundle, options.compositionOverrides, form.netQuantity, language);
}

function resolvePreviewLanguage(options: BuildLabelPreviewPayloadOptions): LabelLanguage {
  return options.previewLanguage || options.form.language || options.currentLabel?.language || 'FR';
}

function resolvePreviewIngredientDeclaration(options: BuildLabelPreviewPayloadOptions, previewLang: LabelLanguage): string {
  const { form, currentLabel } = options;
  const formLang = form.language || currentLabel?.language || 'FR';
  const custom = form.ingredientDeclaration?.trim() || currentLabel?.ingredientDeclaration?.trim();

  if (custom && previewLang === formLang) {
    return custom;
  }

  return buildLocalizedIngredientDeclaration(form.qualityGrade, previewLang);
}

function resolvePreviewLegalDenomination(options: BuildLabelPreviewPayloadOptions, previewLang: LabelLanguage): string {
  const { form, currentLabel } = options;
  const custom = form.legalDenomination?.trim() || currentLabel?.legalDenomination?.trim();
  const localized = buildLocalizedProductName(form.qualityGrade, previewLang);

  if (custom && previewLang === (form.language || currentLabel?.language || 'FR')) {
    return custom;
  }

  return localized || custom || (previewLang === 'FR' ? "Huile d'Olive" : localized || 'Olive Oil');
}

function resolvePreviewStorageConditions(options: BuildLabelPreviewPayloadOptions, previewLang: LabelLanguage): string {
  const { form, currentLabel } = options;
  const formLang = form.language || currentLabel?.language || 'FR';
  const custom = form.storageConditions?.trim() || currentLabel?.storageConditions?.trim();

  if (custom && previewLang === formLang) {
    return custom;
  }

  return resolveLocalizedStorageConditions(custom, previewLang);
}

export function buildLabelPreviewViewModel(options: BuildLabelPreviewPayloadOptions): LabelPreviewViewModel {
  const {
    form,
    currentLabel,
    certifications,
    brandName,
    brandLogoData,
    brandLogoContentType,
    resolveQualityLabel,
    resolveVarietyLabel,
    resolveClaimLabel
  } = options;

  const selectedCertNames = form.certifications || [];
  const claimTypes = form.claimTypes || [];
  const resolvedControls = resolvePostFiltrationQualityControls(options.genealogy, currentLabel, options.postFiltrationQualityControls);
  const qcBundle = buildQcBundle(options);
  const previewLang = resolvePreviewLanguage(options);
  const originCountry = resolveLocalizedOrigin(form.originCountry, previewLang);

  return {
    brandName: resolveBrandName(brandName, form, currentLabel),
    brandLogoData: brandLogoData || undefined,
    brandLogoContentType: brandLogoContentType || undefined,
    language: previewLang,
    labelCategory: form.labelCategory || currentLabel?.labelCategory || 'UNIT',
    lotNumber: form.lotNumber?.trim() || currentLabel?.lotNumber || 'BROUILLON',
    legalDenomination: resolvePreviewLegalDenomination(options, previewLang),
    originCountry,
    originDisplay: buildLocalizedOriginLine(form.originCountry, previewLang),
    netQuantity: form.netQuantity?.trim() || '-',
    qualityLabel: resolveQualityLabel(form.qualityGrade),
    varietyLabel: resolveVarietyLabel(form.variety),
    bestBeforeDate: form.bestBeforeDate?.trim() || '-',
    packagingDate: form.packagingDate?.trim() || '-',
    claimTypes,
    claimLabels: claimTypes.length ? claimTypes.map((claim) => resolveClaimLabel(claim)) : currentLabel?.marketingClaims || [],
    certifications: certifications.filter((cert) => selectedCertNames.includes(cert.name)),
    extractionMethod: form.extractionMethod?.trim() || undefined,
    storageConditions: resolvePreviewStorageConditions(options, previewLang),
    sensoryProfile: resolveSensoryProfileDisplay(resolvedControls, form.sensoryProfile) || undefined,
    sensoryFromQualityControl: hasSensoryQualityControls(resolvedControls),
    qualityControls: qcBundle.qualityControls,
    compositionEstimate: qcBundle.compositionEstimate,
    nutritionTable: qcBundle.nutritionTable,
    responsibleName: form.responsibleName?.trim() || '-',
    responsibleAddress: form.responsibleAddress?.trim() || undefined,
    ingredientDeclaration: resolvePreviewIngredientDeclaration(options, previewLang),
    evooLegalStatement: showEvooLegalStatement(form.qualityGrade) ? buildLocalizedEvooStatement(previewLang) : undefined,
    ean13: form.ean13?.trim() || currentLabel?.ean13,
    harvestYear: form.harvestYear?.trim() || currentLabel?.harvestYear,
    acidityLevel: form.acidityLevel?.trim() || currentLabel?.acidityLevel,
    publicCode: currentLabel?.publicCode,
    status: currentLabel?.status,
    statusLabel: resolveStatusLabel(currentLabel?.status)
  };
}

export function buildLabelEtiquettePayload(options: BuildLabelPreviewPayloadOptions): Record<string, unknown> {
  const {
    form,
    currentLabel,
    certifications,
    brandName,
    brandLogoData,
    brandLogoContentType,
    resolveQualityLabel,
    resolveVarietyLabel,
    resolveClaimLabel
  } = options;

  const selectedCerts = certifications.filter((cert) => (form.certifications || []).includes(cert.name));
  const claimTypes = form.claimTypes || [];
  const marketingClaims = claimTypes.length ? claimTypes.map((claim) => resolveClaimLabel(claim)) : currentLabel?.marketingClaims || [];
  const mergedCertifications = Array.from(new Set([...(form.certifications || []), ...marketingClaims]));
  const resolvedControls = resolvePostFiltrationQualityControls(options.genealogy, currentLabel, options.postFiltrationQualityControls);
  const qcBundle = buildQcBundle(options);
  const previewLang = resolvePreviewLanguage(options);

  return {
    brandName: resolveBrandName(brandName, form, currentLabel),
    brandLogoData: brandLogoData || null,
    brandLogoContentType: brandLogoContentType || null,
    legalDenomination: resolvePreviewLegalDenomination(options, previewLang),
    originCountry: resolveLocalizedOrigin(form.originCountry, previewLang),
    netQuantity: form.netQuantity?.trim() || null,
    bestBeforeDate: form.bestBeforeDate?.trim() || null,
    storageConditions: resolvePreviewStorageConditions(options, previewLang),
    responsibleName: form.responsibleName?.trim() || null,
    responsibleAddress: form.responsibleAddress?.trim() || null,
    lotNumber: form.lotNumber?.trim() || null,
    variety: form.variety?.trim() || null,
    varietyLabel: resolveVarietyLabel(form.variety),
    qualityGrade: form.qualityGrade || null,
    qualityGradeLabel: resolveQualityLabel(form.qualityGrade),
    extractionMethod: form.extractionMethod?.trim() || null,
    sensoryProfile: resolveSensoryProfileDisplay(resolvedControls, form.sensoryProfile) || null,
    postFiltrationQualityControls: qcBundle.postFiltrationQualityControls,
    qualityControls: qcBundle.qualityControls,
    oilCompositionEstimate: qcBundle.compositionEstimate,
    nutritionTable: qcBundle.nutritionTable,
    language: previewLang,
    labelCategory: form.labelCategory || currentLabel?.labelCategory || 'UNIT',
    packagingDate: form.packagingDate || currentLabel?.packagingDate || null,
    claimTypes,
    marketingClaims,
    certifications: mergedCertifications,
    certificationsDetail: selectedCerts.map((cert) => ({
      name: cert.name,
      logoData: cert.logoData,
      logoContentType: cert.logoContentType
    })),
    status: currentLabel?.status || 'DRAFT',
    publicCode: currentLabel?.publicCode || null,
    labelId: currentLabel?.id || null,
    lotId: currentLabel?.lotId || null,
    packagingId: currentLabel?.packagingId || null,
    traceabilityLotId: currentLabel?.traceabilityLotId || null,
    filtrationOperationId: currentLabel?.filtrationOperationId || null,
    productId: currentLabel?.productId || null,
    finalizedAt: currentLabel?.finalizedAt || null,
    finalizedBy: currentLabel?.finalizedBy || null
  };
}

export function formatLabelPayloadJson(payload: string | Record<string, unknown>): string {
  if (typeof payload === 'string') {
    if (!payload.trim()) {
      return '';
    }

    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  }

  return JSON.stringify(payload, null, 2);
}

function resolveStatusLabel(status: LabelContentDto['status'] | undefined): string {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon';
    case 'FINALIZED':
      return 'Finalisée';
    case 'VALIDATED':
      return 'Validée';
    case 'EXPORTED_JSON':
      return 'Exportée JSON';
    default:
      return 'Brouillon';
  }
}

export function labelDtoToFormValues(label: LabelContentDto): LabelFormPreviewValues {
  return {
    language: label.language,
    labelCategory: label.labelCategory,
    lotNumber: label.lotNumber,
    legalDenomination: label.legalDenomination,
    originCountry: label.originCountry,
    netQuantity: label.netQuantity,
    qualityGrade: label.qualityGrade != null ? String(label.qualityGrade) : null,
    variety: label.variety,
    bestBeforeDate: label.bestBeforeDate,
    packagingDate: label.packagingDate,
    claimTypes: label.claimTypes,
    certifications: label.certifications,
    extractionMethod: label.extractionMethod,
    storageConditions: label.storageConditions,
    sensoryProfile: label.sensoryProfile,
    responsibleName: label.responsibleName,
    responsibleAddress: label.responsibleAddress
  };
}

export interface BuildLabelPreviewFromDtoOptions extends Omit<BuildLabelPreviewPayloadOptions, 'form' | 'currentLabel'> {
  label: LabelContentDto;
  languageDisplay?: string;
  categoryDisplay?: string;
}

export function buildLabelPreviewFromDto(options: BuildLabelPreviewFromDtoOptions): {
  viewModel: LabelPreviewViewModel;
  payload: Record<string, unknown>;
} {
  const form = labelDtoToFormValues(options.label);
  const baseOptions = {
    ...options,
    form,
    currentLabel: options.label
  };
  const viewModel = buildLabelPreviewViewModel(baseOptions);

  if (options.languageDisplay) {
    viewModel.language = options.languageDisplay;
  }

  if (options.categoryDisplay) {
    viewModel.labelCategory = options.categoryDisplay;
  }

  return {
    viewModel,
    payload: buildLabelEtiquettePayload(baseOptions)
  };
}

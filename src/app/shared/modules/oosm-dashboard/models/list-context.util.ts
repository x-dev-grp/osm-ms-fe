import { DashboardConfig, ListContextConfig } from './dashboard-config';

export interface ResolvedListContext {
  titleTranslatePath?: string;
  titleFallback?: string;
  hintTranslatePath: string;
  icon: string;
  variant: 'default' | 'olive' | 'inventory';
}

const LIST_CONTEXT_OVERRIDES: Record<string, ListContextConfig> = {
  'MENU.RECEPTION.AGRICULTURE': {
    titleTranslatePath: 'SUPPLIER.DOMAIN.OLIVE_OIL_BADGE',
    hintTranslatePath: 'SUPPLIER.DOMAIN.OLIVE_OIL_HINT',
    icon: 'agriculture',
    variant: 'olive'
  },
  'DASHBOARD_TITLES.MATERIEL_SUPPLIERS': {
    titleTranslatePath: 'MATERIEL_SUPPLIER.DOMAIN.ARTICLES_BADGE',
    hintTranslatePath: 'MATERIEL_SUPPLIER.DOMAIN.ARTICLES_HINT',
    icon: 'inventory_2',
    variant: 'inventory'
  }
};

export function resolveListContext(config: DashboardConfig): ResolvedListContext | null {
  if (config.listContext === false) {
    return null;
  }

  const explicit = config.listContext;
  const override = config.titleTranslatePath ? LIST_CONTEXT_OVERRIDES[config.titleTranslatePath] : undefined;
  const merged: ListContextConfig = { ...override, ...explicit };

  if (merged.hintTranslatePath) {
    return {
      titleTranslatePath: merged.titleTranslatePath || config.titleTranslatePath,
      titleFallback: config.title,
      hintTranslatePath: merged.hintTranslatePath,
      icon: merged.icon || config.icon || 'info_outline',
      variant: merged.variant || 'default'
    };
  }

  const titlePath = config.titleTranslatePath?.trim();
  if (!titlePath) {
    if (!config.title) {
      return null;
    }
    return {
      titleFallback: config.title,
      hintTranslatePath: 'OSM_DASHBOARD.LIST_HINT.DEFAULT',
      icon: config.icon || 'info_outline',
      variant: 'default'
    };
  }

  return {
    titleTranslatePath: titlePath,
    titleFallback: config.title,
    hintTranslatePath: resolveHintTranslatePath(config, titlePath),
    icon: merged.icon || config.icon || 'info_outline',
    variant: merged.variant || 'default'
  };
}

function resolveHintTranslatePath(config: DashboardConfig, titlePath: string): string {
  const operationType = extractOperationType(config);
  if (operationType) {
    return `OSM_DASHBOARD.LIST_HINT.DELIVERIES_OPERATION_TYPE_${operationType}`;
  }

  if (looksLikeTranslationKey(titlePath)) {
    return `OSM_DASHBOARD.LIST_HINT.${titlePath.replace(/\./g, '_')}`;
  }

  return 'OSM_DASHBOARD.LIST_HINT.DEFAULT';
}

function extractOperationType(config: DashboardConfig): string | null {
  const search = config.defaultSearchData?.searchData?.search as Record<string, { equalValue?: string }> | undefined;
  const value = search?.['operationType']?.equalValue;
  return value ? String(value).toUpperCase() : null;
}

export function translateWithFallback(
  translateInstant: (key: string) => string,
  key: string | undefined,
  fallbackKey: string,
  literalFallback?: string
): string {
  if (key) {
    const translated = translateInstant(key);
    if (translated !== key) {
      return translated;
    }
    if (!looksLikeTranslationKey(key)) {
      return key;
    }
    if (literalFallback) {
      return literalFallback;
    }
  }

  const fallback = translateInstant(fallbackKey);
  if (fallback !== fallbackKey) {
    return fallback;
  }

  return literalFallback ?? '';
}

export function translateHintWithFallback(
  translateInstant: (key: string) => string,
  key: string,
  fallbackKey = 'OSM_DASHBOARD.LIST_HINT.DEFAULT'
): string {
  const translated = translateInstant(key);
  if (translated !== key) {
    return translated;
  }

  const fallback = translateInstant(fallbackKey);
  return fallback !== fallbackKey ? fallback : '';
}

function looksLikeTranslationKey(key: string): boolean {
  return /^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/i.test(key.trim());
}

export interface LiquidGlassTarget {
  id: string;
  labelKey: string;
  icon: string;
}

/** Overlay / floating UI surfaces that receive the liquid-glass effect when enabled. */
export const LIQUID_GLASS_TARGETS: LiquidGlassTarget[] = [
  {
    id: 'menus',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.MENUS',
    icon: 'more_vert'
  },
  {
    id: 'dialogs',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.DIALOGS',
    icon: 'web_asset'
  },
  {
    id: 'selects',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.SELECTS',
    icon: 'arrow_drop_down_circle'
  },
  {
    id: 'datepickers',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.DATEPICKERS',
    icon: 'calendar_month'
  },
  {
    id: 'autocomplete',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.AUTOCOMPLETE',
    icon: 'manage_search'
  },
  {
    id: 'bottomSheets',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.BOTTOM_SHEETS',
    icon: 'vertical_align_top'
  },
  {
    id: 'snackbars',
    labelKey: 'APPLICATION_CONFIG.LIQUID_GLASS.TARGETS.SNACKBARS',
    icon: 'notifications'
  }
];

export type DashboardExportFormat = 'csv' | 'excel' | 'pdf';

export interface DashboardExportColumn {
  key: string;
  label: string;
}

export interface DashboardExportSheet {
  name: string;
  columns: DashboardExportColumn[];
  rows: Array<Record<string, string | number | boolean | null | undefined>>;
}

export interface DashboardExportPayload {
  /** Base filename without extension */
  fileName: string;
  /** Document title shown in PDF header */
  title: string;
  sheets: DashboardExportSheet[];
}

export function createKpiSheet(
  name: string,
  items: Array<{ label: string; value: string | number | null | undefined }>
): DashboardExportSheet {
  return {
    name,
    columns: [
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' }
    ],
    rows: items.map((item) => ({
      label: item.label,
      value: item.value ?? ''
    }))
  };
}

export function hasExportableData(payload: DashboardExportPayload | null | undefined): boolean {
  return !!payload?.sheets?.some((sheet) => sheet.rows.length > 0);
}

export interface PdfField {
  label: string;
  value: string;
}

export interface PdfFooterInfo {
  label: string;
  placeholder?: string;
}

export interface PdfConfig {
  title: string;
  reference: string;
  date?: string;
  fields: PdfField[];
  generalInfo?: PdfField[];
  footerInfo?: PdfFooterInfo[];
  fileName?: string;
}

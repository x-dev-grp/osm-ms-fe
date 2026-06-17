import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { TranslateService } from '@ngx-translate/core';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfile } from '../models/CompanyProfile';
import { PdfConfig } from '../models/pdf-config.model';

const center = 'center';

const fontStyle = 'normal';

const fontStyle1 = 'bold';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  logoPreview: string | null = null;
  private profile: CompanyProfile | undefined;
  private readonly _fontName = 'helvetica';
  private readonly _format = 'JPEG';
  private readonly _fontStyleItalic = 'italic';

  constructor(
    private translationService: TranslateService,
    private _companyProfileService: CompanyProfileService,
  ) {
    this.loadProfile();
  }
// Returns true if value is meaningfully non-empty after trimming.
  private hasText(v: any): boolean {
    if (v == null) return false;
    const s = String(v).trim();
    return s.length > 0 && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null';
  }

// Convert any value to a safe, human string (no [object Object], no undefined)
  private safeText(v: any, fallback = '—'): string {
    if (v == null) return fallback;

    // primitives
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      const s = String(v).trim();
      return this.hasText(s) ? s : fallback;
    }

    // try common props for objects
    const candidate = v?.label ?? v?.name ?? v?.code ?? v?.designation ?? v?.id;
    if (this.hasText(candidate)) return String(candidate);

    try {
      // last resort: JSON (short)
      const str = JSON.stringify(v);
      return this.hasText(str) ? str : fallback;
    } catch {
      return fallback;
    }
  }

// If value looks like a translation key (PDF.*), translate it; else return as safe text.
  private translateOrText(v: any, fallback = '—'): string {
    if (typeof v === 'string' && v.startsWith('PDF.')) {
      return this.translationService.instant(v) || fallback;
    }
    return this.safeText(v, fallback);
  }

  generatePdfDocument(config: PdfConfig): void {
    const getLogoPromise = this.logoPreview
      ? Promise.resolve(this.logoPreview)
      : this.getBase64ImageFromUrl('assets/logo.jpg');

    getLogoPromise.then((base64Logo) => {
      const doc = new jsPDF();
      let currentY = 10;

      // Dates & dimensions
      const documentDate = this.safeText(config.date, new Date().toLocaleDateString());
      const marginLeft = 10;
      const logoWidth = 30;
      const logoHeight = 20;
      const headerHeight = 20;
      const pageWidth = 210;

      // --- Logo box ---
      doc.rect(marginLeft, currentY, logoWidth, logoHeight);
      doc.addImage(base64Logo, this._format, marginLeft + 1, currentY + 1, logoWidth - 2, logoHeight - 2);

      // --- Center title box ---
      const centerX = marginLeft + logoWidth;
      const centerWidth = 100;
      doc.rect(centerX, currentY, centerWidth, headerHeight);
      doc.setFontSize(12);
      doc.setFont(this._fontName, 'bold');
      doc.text(this.translationService.instant('PDF.FORM'), centerX + centerWidth / 2, currentY + 7, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont(this._fontName, this._fontStyleItalic);
      // Title always a key (e.g., GEN_PDF_BON_COMMANDE)
      doc.text(
        this.translationService.instant(this.safeText(config.titleTranslatePath || config.title, '')),
        centerX + centerWidth / 2,
        currentY + 14,
        { align: 'center' }
      );

      // --- Right info box ---
      const rightX = centerX + centerWidth;
      const rowHeight = 5;
      const infoWidth = pageWidth - rightX - marginLeft;

      const infoRows = [
        { label: this.translationService.instant('PDF.REFERENCE'), value: this.safeText(config.reference, '—') },
        { label: this.translationService.instant('PDF.REVISION'),  value: this.safeText(config.revision, '....') },
        { label: this.translationService.instant('PDF.DATE'),      value: documentDate },
        { label: this.translationService.instant('PDF.PAGE'),      value: '1/1' }
      ];

      infoRows.forEach((row, index) => {7

        const y = currentY + index * rowHeight;
        doc.rect(rightX, y, infoWidth, rowHeight);
        doc.setFontSize(9);
        doc.setFont(this._fontName, 'normal');
        doc.text(`${row.label} : ${row.value}`, rightX + 2, y + 4);
      });

      currentY += headerHeight + 10;

      // --- Number (optional) ---
      const numberText = this.hasText((config as any).Number)
        ? `${this.translationService.instant('PDF.NUMBER_PLACEHOLDER')}${this.safeText((config as any).Number)}`
        : ``;
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(10);
      doc.text(numberText, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // --- General info (skip empty) ---
      const generalInfo = (config.generalInfo || [])
        .map(g => ({
          label: this.translationService.instant(this.safeText(g.labelTranslatePath || g.label, '')),
          // g.value may be a key (PDF.*) or plain value
          value: this.translateOrText(g.value)
        }))
        .filter(g => this.hasText(g.label) && this.hasText(g.value));

      if (generalInfo.length) {
        doc.setFontSize(12);
        doc.setFont(this._fontName, 'normal');
        generalInfo.forEach((info) => {
          doc.text(`${info.label} : ${this.translationService.instant(info.value)}`, marginLeft, currentY);
          currentY += 10;
        });
        currentY += 15;
      }

      // === Horizontal fields row (labels on top, values under) ===
      const fields = (config.fields || [])
        .map(f => ({
          label: this.translationService.instant(this.safeText(f.labelTranslatePath || f.label, '')),
          value: this.safeText(f.value, '—')
        }))
        .filter(f => this.hasText(f.label) && this.hasText(f.value));

      if (fields.length) {
        const tableLeft = marginLeft;
        const tableWidth = 190;
        const colCount = fields.length;
        const colWidth = tableWidth / colCount;
        const baseFontSize = 9;

        // Labels
        const splitLabels: string[][] = fields.map((field) =>
          doc.splitTextToSize(field.label, colWidth - 4)
        );
        const lineHeights = splitLabels.map((lines) => lines.length);
        const maxLines = Math.max(...lineHeights);
        const labelRowHeight = maxLines * 5 + 2;

        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(baseFontSize);
        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.setFillColor(200, 200, 200);
          doc.rect(x, currentY, colWidth, labelRowHeight, 'FD');

          const lines = splitLabels[i];
          lines.forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }

        // Values
        currentY += labelRowHeight;
        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(baseFontSize);
        const splitValues: string[][] = fields.map((field) =>
          doc.splitTextToSize(field.value, colWidth - 4)
        );
        const valueLineHeights = splitValues.map((lines) => lines.length);
        const maxValueLines = Math.max(...valueLineHeights);
        const dataRowHeight = maxValueLines * 5 + 2;

        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.rect(x, currentY, colWidth, dataRowHeight);

          const lines = splitValues[i];
          lines.forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }
        currentY += dataRowHeight + 5 + 5 /* spacing */;
      }

      // --- Footer ---
      if (config.footerInfo && config.footerInfo.length > 0) {
        const separatorY = 270;
        doc.setDrawColor(0);
        doc.line(10, separatorY, 200, separatorY);

        const footerY = 280;
        const marginRight = 10;
        const usableWidth = pageWidth - marginLeft - marginRight;
        const maxItemsPerRow = 4;
        const itemCount = Math.min(config.footerInfo.length, maxItemsPerRow);
        const spacing = usableWidth / itemCount;
        const footerLabelWidth = 40;

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(10);

        config.footerInfo.slice(0, maxItemsPerRow).forEach((footerItem, index) => {
          const x = marginLeft + index * spacing;
          const label = this.translationService.instant(
            this.safeText(footerItem.labelTranslatePath || footerItem.label, '')
          );
          if (!this.hasText(label)) return;

          doc.text(`${label} :`, x, footerY);

          if (this.hasText(footerItem.placeholder)) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(this.safeText(footerItem.placeholder), x + footerLabelWidth, footerY);
            doc.setTextColor(0);
            doc.setFontSize(10);
          }
        });
      }

      // Open PDF
      window.open(doc.output('bloburl'), '_blank');
    });
  }

  getBase64ImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      };

      img.onerror = (error) => {
        reject(error);
      };
    });
  }

  // pdf-generator.service.ts
  generatePdf(config: PdfConfig): void {
    this.generatePdfDocument(config);
  }

  private loadProfile(): void {
    this._companyProfileService.getProfile().subscribe(
      (res) => {
        if (res) {
          this.profile = res;
          if (this.profile?.logoData && this.profile?.logoContentType) {
            this.logoPreview = `data:${this.profile?.logoContentType};base64,${this.profile?.logoData}`;
          }
        }
      },
      (err) => console.error('Error loading logo', err)
    );
  }
}

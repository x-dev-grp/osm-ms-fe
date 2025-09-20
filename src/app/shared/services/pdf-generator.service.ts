import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import {TranslateService} from '@ngx-translate/core';
import {CompanyProfileService} from './company-profile.service';
import {CompanyProfile} from '../models/CompanyProfile';
import {PdfConfig} from "../models/pdf-config.model";

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

  generatePdfDocument(config: {
    title: string;
    reference: string;
    date?: string;
    fields?: { label: string; value: string }[];
    generalInfo?: { label: string; value: string }[];
    footerInfo?: { label: string; placeholder?: string }[];
    fileName?: string;
  }): void {
    // Use company logo if available, otherwise fallback to default
    const getLogoPromise = this.logoPreview ? Promise.resolve(this.logoPreview) : this.getBase64ImageFromUrl('assets/logo.jpg');

    getLogoPromise.then((base64Logo) => {
      const doc = new jsPDF();
      let currentY = 10;

      const documentDate = config.date || new Date().toLocaleDateString();

      // Dimensions
      const marginLeft = 10;
      const logoWidth = 30;
      const logoHeight = 20;
      const headerHeight = 20;
      const pageWidth = 210;

      // Logo
      doc.rect(marginLeft, currentY, logoWidth, logoHeight);
      doc.addImage(base64Logo, this._format, marginLeft + 1, currentY + 1, logoWidth - 2, logoHeight - 2);

      // Centre
      const centerX = marginLeft + logoWidth;
      const centerWidth = 100;
      doc.rect(centerX, currentY, centerWidth, headerHeight);
      doc.setFontSize(12);
      doc.setFont(this._fontName, fontStyle1);
      doc.text(this.translationService.instant('PDF.FORM'), centerX + centerWidth / 2, currentY + 7, {align: center});
      doc.setFontSize(10);
      doc.setFont(this._fontName, this._fontStyleItalic);
      doc.text(this.translationService.instant(config.title), centerX + centerWidth / 2, currentY + 14, {align: center});

      // Droite
      const rightX = centerX + centerWidth;
      const rowHeight = 5;
      const infoWidth = pageWidth - rightX - marginLeft;
      const infoRows = [
        {label: this.translationService.instant('PDF.REFERENCE'), value: config.reference},
        {
          label: this.translationService.instant('PDF.REVISION'),
          value: '00'
        },
        {
          label: this.translationService.instant('PDF.DATE'),
          value: documentDate
        },
        {label: this.translationService.instant('PDF.PAGE'), value: '1/1'}
      ];

      infoRows.forEach((row, index) => {
        const y = currentY + index * rowHeight;
        doc.rect(rightX, y, infoWidth, rowHeight);
        doc.setFontSize(9);
        doc.setFont(this._fontName, fontStyle);
        doc.text(`${row.label} : ${row.value}`, rightX + 2, y + 4);
      });

      currentY += headerHeight + 10;

      // Numéro
      doc.setFont(this._fontName, fontStyle1);
      doc.setFontSize(10);
      doc.text(this.translationService.instant('PDF.NUMBER_PLACEHOLDER'), pageWidth / 2, currentY, {align: center});
      currentY += 15;

      // Infos générales
      if (config.generalInfo && config.generalInfo.length > 0) {
        doc.setFontSize(12);
        doc.setFont(this._fontName, fontStyle);
        config.generalInfo.forEach((info) => {
          let translatedValue = info.value;
          // Si la valeur commence par 'PDF.', c'est une clé de traduction
          if (info.value.startsWith('PDF.')) {
            translatedValue = this.translationService.instant(info.value);
          }
          doc.text(`${this.translationService.instant(info.label)} : ${translatedValue}`, marginLeft, currentY);
          currentY += 10;
        });
        currentY += 15;
      }

      // === Tableau horizontal (labels en haut, données en bas) ===
      if (config.fields && config.fields.length > 0) {
        const tableLeft = marginLeft;
        const tableWidth = 190;
        const colCount = config.fields.length;
        const colWidth = tableWidth / colCount;
        const baseFontSize = 9;

        // Split & calcul des lignes pour les labels
        const splitLabels: string[][] = config.fields.map((field) =>
          doc.splitTextToSize(this.translationService.instant(field.label), colWidth - 4)
        );
        const lineHeights = splitLabels.map((lines) => lines.length);
        const maxLines = Math.max(...lineHeights);
        const labelRowHeight = maxLines * 5 + 2;

        // TH (labels)
        doc.setFont(this._fontName, fontStyle1);
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

        // TD (données)
        currentY += labelRowHeight;
        doc.setFont(this._fontName, fontStyle);
        doc.setFontSize(baseFontSize);
        // Split & calcul des lignes pour les valeurs (données)
        const splitValues: string[][] = config.fields.map((field) => doc.splitTextToSize(field.value || '', colWidth - 4));
        const valueLineHeights = splitValues.map((lines) => lines.length);
        const maxValueLines = Math.max(...valueLineHeights);
        const dataRowHeight = maxValueLines * 5 + 2;

        // TD (données)
        doc.setFont(this._fontName, fontStyle);
        doc.setFontSize(baseFontSize);

        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.rect(x, currentY, colWidth, dataRowHeight);

          const lines = splitValues[i];
          lines.forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }
        currentY += dataRowHeight + 5;

        currentY += rowHeight + 15;
      }

      // FOOTER
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

        doc.setFont(this._fontName, fontStyle);
        doc.setFontSize(10);

        config.footerInfo.slice(0, maxItemsPerRow).forEach((footerItem, index) => {
          const x = marginLeft + index * spacing;
          doc.text(`${this.translationService.instant(footerItem.label)} :`, x, footerY);
          if (footerItem.placeholder) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(footerItem.placeholder, x + footerLabelWidth, footerY);
            doc.setTextColor(0);
            doc.setFontSize(10);
          }
        });
      }

      // Affichage du PDF
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
        if (res ) {
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

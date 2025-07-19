import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { UnifiedDelivery } from '../models/UnifiedDelivery';
import { TranslateService } from '@ngx-translate/core';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfile } from '../models/CompanyProfile';
import { AuthenticationService } from '../../auth/services/authentication.service';

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
    private translationServiec: TranslateService,
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
      doc.text(this.translationServiec.instant('PDF.FORM'), centerX + centerWidth / 2, currentY + 7, { align: center });
      doc.setFontSize(10);
      doc.setFont(this._fontName, this._fontStyleItalic);
      doc.text(this.translationServiec.instant(config.title), centerX + centerWidth / 2, currentY + 14, { align: center });

      // Droite
      const rightX = centerX + centerWidth;
      const rowHeight = 5;
      const infoWidth = pageWidth - rightX - marginLeft;
      const infoRows = [
        { label: this.translationServiec.instant('PDF.REFERENCE'), value: config.reference },
        {
          label: this.translationServiec.instant('PDF.REVISION'),
          value: '00'
        },
        {
          label: this.translationServiec.instant('PDF.DATE'),
          value: documentDate
        },
        { label: this.translationServiec.instant('PDF.PAGE'), value: '1/1' }
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
      doc.text(this.translationServiec.instant('PDF.NUMBER_PLACEHOLDER'), pageWidth / 2, currentY, { align: center });
      currentY += 15;

      // Infos générales
      if (config.generalInfo && config.generalInfo.length > 0) {
        doc.setFontSize(12);
        doc.setFont(this._fontName, fontStyle);
        config.generalInfo.forEach((info) => {
          doc.text(`${this.translationServiec.instant(info.label)} : ${info.value}`, marginLeft, currentY);
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
          doc.splitTextToSize(this.translationServiec.instant(field.label), colWidth - 4)
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
          doc.text(`${this.translationServiec.instant(footerItem.label)} :`, x, footerY);
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

  generateReceptionPdf(delivery: UnifiedDelivery, type: 'OIL' | 'OLIVE'): void {
    const isHuile = type === 'OIL';

    const commonData = {
      reference: delivery.lotNumber || '',
      date: '',
      generalInfo: [
        { label: 'PDF.TYPE', value: delivery.deliveryType || '' },
        {
          label: 'PDF.SUPPLIER',
          value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
        },
        { label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || '' },
        {
          label: 'PDF.ADDRESS',
          value: delivery.supplier?.supplierInfo?.address || ''
        }
      ],
      footerInfo: [
        { label: 'PDF.SIGNATURE_AGENT', placeholder: '' },
        {
          label: 'PDF.SIGNATURE_RESPONSIBLE',
          placeholder: ''
        }
      ]
    };

    const fields = isHuile
      ? [
          { label: 'PDF.LOT', value: delivery.lotNumber || '' },
          {
            label: 'PDF.LOT_GLOBAL',
            value: delivery.globalLotNumber || ''
          },
          { label: 'PDF.GROSS_WEIGHT', value: `${delivery.poidsBrute || ''} kg` },
          {
            label: 'PDF.OIL_QUANTITY',
            value: `${delivery.oilQuantity || ''} kg`
          },
          { label: 'PDF.OIL_VARIETY', value: delivery.oilVariety?.name || '' },
          {
            label: 'PDF.OIL_TYPE',
            value: delivery.oilType?.name || ''
          },
          { label: 'PDF.REGION', value: delivery.region?.name || '' }
        ]
      : [
          {
            label: 'PDF.LOT',
            value: delivery.lotNumber || ''
          },
          { label: 'PDF.LOT_GLOBAL', value: delivery.globalLotNumber || '' },
          {
            label: 'PDF.GROSS_WEIGHT',
            value: `${delivery.poidsBrute || ''} kg`
          },
          { label: 'PDF.OLIVE_QUANTITY', value: `${delivery.oilQuantity || ''} kg` },
          {
            label: 'PDF.OLIVE_VARIETY',
            value: delivery.oliveVariety?.name || ''
          },
          { label: 'PDF.OLIVE_TYPE', value: delivery.oliveType?.name || '' },
          {
            label: 'PDF.REGION',
            value: delivery.region?.name || ''
          }
        ];

    const title = isHuile ? 'PDF.RECEPTION_OIL' : 'PDF.RECEPTION_OLIVE';
    const fileName = isHuile
      ? `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
      : `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`;

    this.generatePdfDocument({
      ...commonData,
      title,
      fields,
      fileName
    });
  }

  // pdf-generator.service.ts

  generateProductionPDF(dataEntry: any): void {
    const dateLivraison = new Date(dataEntry.deliveryDate).toLocaleDateString();
    const dateTrituration = new Date(dataEntry.trtDate).toLocaleDateString();

    const poidsNetOlives = `${dataEntry.poidsNet} kg`;
    const qteHuile = `${dataEntry.oilQuantity || 0} L`;
    const rendement = `${(dataEntry.rendement || 0).toFixed(2)} %`;

    // À adapter selon ton modèle métier ou API
    const prixTriturationParKg = '0.15 DNT/kg';
    const prixTotalTrituration = `${(dataEntry.poidsNet * 0.15).toFixed(2)} DNT`;

    // Infos générales
    const generalInfo = [
      { label: 'PDF.LOT_NUMBER', value: dataEntry.lotNumber || '-' },
      {
        label: 'PDF.RECEPTION_NUMBER',
        value: dataEntry.deliveryNumber || '-'
      },
      { label: 'PDF.DELIVERY_DATE', value: dateLivraison },
      {
        label: 'PDF.OLIVE_NET_WEIGHT',
        value: poidsNetOlives
      },
      { label: 'PDF.SUPPLIER', value: dataEntry.supplier?.supplierInfo?.name || '-' },
      {
        label: 'PDF.REGION',
        value: dataEntry.region?.name || '-'
      },
      { label: 'PDF.OLIVE_VARIETY', value: dataEntry.oliveVariety?.name || '-' },
      {
        label: 'PDF.OLIVE_TYPE',
        value: dataEntry.oliveType?.name || '-'
      }
    ];

    // Données à afficher dans un tableau (si nécessaire)
    const fields = [
      { label: 'PDF.OIL_QUANTITY', value: qteHuile },
      {
        label: 'PDF.YIELD',
        value: rendement
      },
      { label: 'PDF.CRUSHING_PRICE_PER_KG', value: prixTriturationParKg },
      {
        label: 'PDF.CRUSHING_TOTAL_PRICE',
        value: prixTotalTrituration
      },
      { label: 'PDF.CRUSHING_DATE', value: dateTrituration }
    ];

    const config = {
      title: 'PDF.PRODUCTION_RECEIPT',
      reference: dataEntry.deliveryNumber || 'N/A',
      date: new Date().toLocaleDateString(),
      generalInfo: generalInfo, // <-- Ces données seront affichées en texte brut (haut du PDF)
      fields: fields, // <-- Ces données seront affichées sous forme de tableau
      footerInfo: [
        { label: 'PDF.QUALITY_MANAGER' },
        { label: 'PDF.PRODUCTION_MANAGER' },
        { label: 'PDF.SIGNATURE' },
        { label: 'PDF.DATE' }
      ],
      fileName: `BonProduction_${dataEntry.lotNumber || 'LOT'}`
    };

    this.generatePdfDocument(config);
  }

  private loadProfile(): void {
    this._companyProfileService.getProfile().subscribe(
      (res) => {
        if (res && res.success) {
          this.profile = res?.data[0];

          if (this.profile?.logoData && this.profile?.logoContentType) {
            this.logoPreview = `data:${this.profile?.logoContentType};base64,${this.profile?.logoData}`;
          }
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
  }
}

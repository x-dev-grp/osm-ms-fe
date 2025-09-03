import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import {TranslateService} from '@ngx-translate/core';
import {CompanyProfileService} from './company-profile.service';
import {PdfFactureConfig} from '../models/pdf-config.model';

const fontStyle = 'normal';
const fontStyleBold = 'bold';

@Injectable({providedIn: 'root'})
export class PdfGeneratorFactureService {
  logoPreview: string | null = null;
  private readonly _fontName = 'helvetica';
  private readonly _format = 'JPEG';

  constructor(
    private translationService: TranslateService,
    private _companyProfileService: CompanyProfileService
  ) {
  }

  generatePdfDocument(config: PdfFactureConfig): void {
    const getLogoPromise = this.logoPreview
      ? Promise.resolve(this.logoPreview)
      : this.getBase64ImageFromUrl('assets/logo.jpg');

    getLogoPromise.then((base64Logo) => {
      const doc = new jsPDF();
      let currentY = 10;

      const marginLeft = 10;
      const marginRight = 10;
      const pageWidth = 210;
      const logoWidth = 30;
      const logoHeight = 20;
      const rightX = pageWidth - 100;
      const fontSizeSmall = 9;
      const fontSizeMedium = 10;
      const fontSizeLarge = 12;
      const rowHeight = 8;
      const lineHeight = 7;

      // --- Fonction sécurisée ---
      const safeText = (text: any, x: number, y: number) => {
        const str = text == null || text === 'undefined' ? '' : String(text).trim();
        if (str) {
          doc.text(str, x, y);
        }
      };

      // --- LOGO ---
      doc.addImage(base64Logo, this._format, marginLeft, currentY, logoWidth, logoHeight);

      // --- INFO SOCIÉTÉ (à gauche) ---
      const companyInfoX = marginLeft + 10;
      const companyInfoYStart = currentY + 25;
      doc.setFont(this._fontName, fontStyle);
      doc.setFontSize(fontSizeSmall);
      safeText(config.companyInfo?.companyName || this.translationService.instant('PDF.COMPANY_NAME'), companyInfoX, companyInfoYStart);
      safeText(config.companyInfo?.address || this.translationService.instant('PDF.ADDRESS'), companyInfoX, companyInfoYStart + lineHeight);
      safeText(`VAT ${config.companyInfo?.vatNumber || this.translationService.instant('PDF.VAT')}`, companyInfoX, companyInfoYStart + 2 * lineHeight);
      safeText(`Mobile ${config.companyInfo?.mobile || this.translationService.instant('PDF.MOBILE')}`, companyInfoX, companyInfoYStart + 3 * lineHeight);
      safeText(`w.${config.companyInfo?.website || this.translationService.instant('PDF.WEBSITE')}`, companyInfoX, companyInfoYStart + 4 * lineHeight);

      // --- TITRE ET RÉFÉRENCE (à droite) ---
      doc.setFontSize(fontSizeLarge);
      doc.setFont(this._fontName, fontStyleBold);
      safeText(config.title || 'FACTURE', rightX, currentY + 25);
      doc.setFontSize(fontSizeMedium);
      doc.setFont(this._fontName, fontStyle);
      safeText(`Réf : ${config.reference}`, rightX, currentY + 32);
      safeText(`Date : ${config.date || new Date().toLocaleDateString()}`, rightX, currentY + 39);

      // --- INFOS CLIENT - Bloc encadré à droite ---
      const clientBlockX = rightX;
      const clientBlockYStart = currentY + 45;
      const clientBlockWidth = pageWidth - clientBlockX - marginRight;
      const clientPadding = 4;

      // Hauteur dynamique
      const clientInfoCount = config.generalInfo?.length || 0;
      const clientBlockHeight = 6 + (clientInfoCount * lineHeight);

      // Fond + cadre
      doc.setFillColor(245, 245, 245);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight, 'FD');
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight);

      // Titre
      doc.setFont(this._fontName, fontStyleBold);
      doc.setFontSize(fontSizeSmall);
      safeText(this.translationService.instant('PDF.CLIENT_INFO'), clientBlockX + clientPadding, clientBlockYStart + 6);

      // Données
      doc.setFont(this._fontName, fontStyle);
      config.generalInfo?.forEach((info, index) => {
        const label = this.translationService.instant(info.label);
        const value = info.value || '';
        const y = clientBlockYStart + 12 + index * lineHeight;
        safeText(`${label} : ${value}`, clientBlockX + clientPadding, y);
      });

      // Mise à jour de currentY
      currentY = clientBlockYStart + clientBlockHeight + 15;

      // --- TABLEAU ---
      const tableLeft = marginLeft;
      const col1Width = 100; // Description
      const col2Width = 30;  // Prix unitaire
      const col3Width = 30;  // Quantité
      const col4Width = 30;  // Total

      // En-tête
      doc.setFillColor(200, 200, 200);
      doc.rect(tableLeft, currentY, col1Width, 10, 'FD');
      doc.rect(tableLeft + col1Width, currentY, col2Width, 10, 'FD');
      doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, 10, 'FD');
      doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, 10, 'FD');

      doc.setFont(this._fontName, fontStyleBold);
      doc.setFontSize(fontSizeSmall);
      safeText(this.translationService.instant('PDF.DESCRIPTION'), tableLeft + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.PRICE_UNIT'), tableLeft + col1Width + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.QUANTITY'), tableLeft + col1Width + col2Width + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.TOTAL'), tableLeft + col1Width + col2Width + col3Width + 2, currentY + 6);

      currentY += 10;

      // --- LIGNE UNIQUE ---
      let totalValue = 0;

      if (config.fields && config.fields.length > 0) {
        // Récupérer les valeurs
        const description = config.fields.find(f => f.label === 'PDF.DESCRIPTION')?.value || '';
        const priceStr = config.fields.find(f => f.label === 'PDF.PRICE_UNIT')?.value || '0';
        const quantityStr = config.fields.find(f => f.label === 'PDF.QUANTITY')?.value || '0';
        const totalStr = config.fields.find(f => f.label === 'PDF.TOTAL')?.value || '0';

        // Extraire les nombres
        const unitPrice = parseFloat(priceStr.replace('TND/kg', '').trim()) || 0;
        const quantity = parseFloat(quantityStr.replace('kg', '').trim()) || 0;
        const amount = unitPrice * quantity;
        totalValue = amount;

        // Dessiner la ligne
        doc.rect(tableLeft, currentY, col1Width, rowHeight);
        doc.rect(tableLeft + col1Width, currentY, col2Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight);

        // Texte
        doc.setFont(this._fontName, fontStyle);
        doc.setFontSize(fontSizeSmall);
        safeText(description, tableLeft + 2, currentY + 5);
        safeText(`${unitPrice.toFixed(2)} TND/kg`, tableLeft + col1Width + 2, currentY + 5);
        safeText(`${quantity.toFixed(2)} kg`, tableLeft + col1Width + col2Width + 2, currentY + 5);
        safeText(`${amount.toFixed(2)} TND`, tableLeft + col1Width + col2Width + col3Width + 2, currentY + 5);

        currentY += rowHeight;
      }

      // --- TOTAL FINAL ---
      const totalX = tableLeft + col1Width + col2Width + col3Width;
      const totalY = currentY;
      const totalWidth = col4Width;
      const totalHeight = rowHeight;

      doc.setLineWidth(0.5);
      doc.rect(totalX, totalY, totalWidth, totalHeight);
      doc.setFont(this._fontName, fontStyleBold);
      doc.setFontSize(fontSizeMedium);
      safeText(`${totalValue.toFixed(2)} TND`, totalX + 2, totalY + 5);

      // --- OUVERTURE DU PDF ---
      window.open(doc.output('bloburl'), '_blank');
    }).catch(err => {
      console.error('Erreur lors du chargement du logo :', err);
      alert('Impossible de générer la facture. Vérifiez que le logo est accessible.');
    });
  }

  // --- CHARGEMENT DU LOGO EN BASE64 ---
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
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg');
          resolve(dataURL);
        } else {
          reject('Impossible de créer le contexte 2D du canvas');
        }
      };

      img.onerror = (error) => {
        reject(error);
      };
    });
  }
}

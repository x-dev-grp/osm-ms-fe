import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import {TranslateService} from '@ngx-translate/core';
import {CompanyProfileService} from './company-profile.service';
import {PdfFactureConfig, PdfPaymentNoteConfig} from '../models/pdf-config.model';

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

      const fontStyle: "normal" | "bold" | "italic" | "bolditalic" = "normal";
      const fontStyleBold: "normal" | "bold" | "italic" | "bolditalic" = "bold";

      // --- Fonction sécurisée ---
      const safeText = (text: any, x: number, y: number) => {
        const str = text == null || text === "undefined" ? "" : String(text).trim();
        if (str) {
          doc.text(str, x, y);
        }
      };

      // --- LOGO ---
      doc.addImage(base64Logo, this._format, marginLeft, currentY, logoWidth, logoHeight);

      // --- INFO SOCIÉTÉ ---
      const companyInfoX = marginLeft + 10;
      const companyInfoYStart = currentY + 25;
      doc.setFont(this._fontName, fontStyle);
      doc.setFontSize(fontSizeSmall);

      safeText(config.companyInfo?.companyName || this.translationService.instant("PDF.COMPANY_NAME"), companyInfoX, companyInfoYStart);
      safeText(config.companyInfo?.address || this.translationService.instant("PDF.ADDRESS"), companyInfoX, companyInfoYStart + lineHeight);

      if (config.companyInfo?.vatNumber) {
        safeText(`VAT: ${config.companyInfo.vatNumber}`, companyInfoX, companyInfoYStart + 2 * lineHeight);
      }

      if (config.companyInfo?.mobile) {
        safeText(`Mobile: ${config.companyInfo.mobile}`, companyInfoX, companyInfoYStart + 3 * lineHeight);
      }

      if (config.companyInfo?.website) {
        safeText(`Website: ${config.companyInfo.website}`, companyInfoX, companyInfoYStart + 4 * lineHeight);
      }

      // --- TITRE & RÉF ---
      doc.setFontSize(fontSizeLarge);
      doc.setFont(this._fontName, fontStyleBold);
      safeText(config.title || "FACTURE", rightX, currentY + 25);
      doc.setFontSize(fontSizeMedium);
      doc.setFont(this._fontName, fontStyle);
      safeText(`Réf : ${config.reference}`, rightX, currentY + 32);
      safeText(`Date : ${config.date || new Date().toLocaleDateString()}`, rightX, currentY + 39);

      // --- INFOS CLIENT ---
      // --- INFOS CLIENT ---
      const clientBlockX = rightX;
      const clientBlockYStart = currentY + 45;
      const clientBlockWidth = pageWidth - clientBlockX - marginRight;
      const clientPadding = 4;

// On filtre uniquement les infos avec valeur
      const clientInfos = (config.generalInfo || []).filter(info => {
        return info.value != null && String(info.value).trim() !== "";
      });

// Mesurer dynamiquement la hauteur totale avec splitTextToSize
      let dynamicHeight = 6; // marge de titre
      const processedInfos: { text: string[]; y: number }[] = [];

      clientInfos.forEach((info) => {
        const label = this.translationService.instant(info.label);
        const value = info.value || "";
        const fullText = `${label} : ${value}`;

        // Découper le texte selon la largeur du bloc
        const wrappedText = doc.splitTextToSize(fullText, clientBlockWidth - 2 * clientPadding);

        processedInfos.push({text: wrappedText, y: dynamicHeight + clientBlockYStart});
        dynamicHeight += wrappedText.length * lineHeight;
      });

      const clientBlockHeight = dynamicHeight + 4; // marge bas

// --- Dessin rectangle ---
      if (processedInfos.length > 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight, "FD");
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight);

        // --- Titre du bloc ---
        doc.setFont(this._fontName, fontStyleBold);
        doc.setFontSize(fontSizeSmall);
        safeText(this.translationService.instant("PDF.CLIENT_INFO"), clientBlockX + clientPadding, clientBlockYStart + 6);

        // --- Contenu ---
        doc.setFont(this._fontName, fontStyle);
        doc.setFontSize(fontSizeSmall);

        let yOffset = clientBlockYStart + 12;
        processedInfos.forEach((info) => {
          info.text.forEach((line) => {
            safeText(line, clientBlockX + clientPadding, yOffset);
            yOffset += lineHeight;
          });
        });
      }

// Décaler Y après le bloc
      currentY = clientBlockYStart + clientBlockHeight + 15;


      // --- TABLEAU ---
      const tableLeft = marginLeft;
      const col1Width = 100;
      const col2Width = 30;
      const col3Width = 30;
      const col4Width = 30;

      doc.setFillColor(200, 200, 200);
      doc.rect(tableLeft, currentY, col1Width, 10, "FD");
      doc.rect(tableLeft + col1Width, currentY, col2Width, 10, "FD");
      doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, 10, "FD");
      doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, 10, "FD");

      doc.setFont(this._fontName, fontStyleBold);
      doc.setFontSize(fontSizeSmall);
      safeText(this.translationService.instant("PDF.DESCRIPTION"), tableLeft + 2, currentY + 6);
      safeText(this.translationService.instant("PDF.PRICE_UNIT"), tableLeft + col1Width + 2, currentY + 6);
      safeText(this.translationService.instant("PDF.QUANTITY"), tableLeft + col1Width + col2Width + 2, currentY + 6);
      safeText(this.translationService.instant("PDF.TOTAL"), tableLeft + col1Width + col2Width + col3Width + 2, currentY + 6);

      currentY += 10;

      let totalValue = 0;

      if (config.fields && config.fields.length > 0) {
        const description = config.fields.find(f => f.label === "PDF.DESCRIPTION")?.value || "";
        const priceStr = config.fields.find(f => f.label === "PDF.PRICE_UNIT")?.value || "0";
        const quantityStr = config.fields.find(f => f.label === "PDF.QUANTITY")?.value || "0";

        const unitPrice = parseFloat(priceStr.replace("TND/kg", "").trim()) || 0;
        const quantity = parseFloat(quantityStr.replace("kg", "").trim()) || 0;
        const amount = unitPrice * quantity;
        totalValue = amount;

        doc.rect(tableLeft, currentY, col1Width, rowHeight);
        doc.rect(tableLeft + col1Width, currentY, col2Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight);

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

      doc.setLineWidth(0.5);
      doc.rect(totalX, totalY, totalWidth, rowHeight);
      doc.setFont(this._fontName, fontStyleBold);
      doc.setFontSize(fontSizeMedium);
      safeText(`${totalValue.toFixed(2)} TND`, totalX + 2, totalY + 5);

      // --- OUVERTURE ---
      window.open(doc.output("bloburl"), "_blank");
    }).catch(err => {
      console.error("Erreur lors du chargement du logo :", err);
      alert("Impossible de générer la facture. Vérifiez que le logo est accessible.");
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


  generatePdfNoteDocument(config: PdfPaymentNoteConfig): void {
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
      const rowHeight = 10;
      const lineHeight = 7;
      const clientPadding = 4;

      const safeText = (text: any, x: number, y: number) => {
        const str = text == null || text === 'undefined' ? '' : String(text).trim();
        if (str) doc.text(str, x, y);
      };

      // --- LOGO ---
      doc.addImage(base64Logo, this._format, marginLeft, currentY, logoWidth, logoHeight);

      // --- COMPANY INFO (à gauche) ---
      const companyInfoX = marginLeft + 10;
      const companyInfoYStart = currentY + 25;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fontSizeSmall);
      safeText(config.companyInfo.companyName || this.translationService.instant('PDF.COMPANY_NAME'), companyInfoX, companyInfoYStart);
      safeText(config.companyInfo.address || this.translationService.instant('PDF.ADDRESS'), companyInfoX, companyInfoYStart + lineHeight);
      safeText(`VAT ${config.companyInfo.vatNumber || this.translationService.instant('PDF.VAT')}`, companyInfoX, companyInfoYStart + 2 * lineHeight);
      safeText(`Mobile ${config.companyInfo.mobile || this.translationService.instant('PDF.MOBILE')}`, companyInfoX, companyInfoYStart + 3 * lineHeight);
      safeText(`w.${config.companyInfo.website || this.translationService.instant('PDF.WEBSITE')}`, companyInfoX, companyInfoYStart + 4 * lineHeight);

      // --- TITLE & REF (à droite) ---
      doc.setFontSize(fontSizeLarge);
      doc.setFont(this._fontName, 'bold');
      const translatedTitle = config.title
        ? this.translationService.instant(config.title)
        : this.translationService.instant('PDF.NOTE_PAYEMENT_RECEPTION');
      safeText(translatedTitle, rightX, currentY + 25);

      doc.setFontSize(fontSizeMedium);
      doc.setFont(this._fontName, 'normal');
      safeText(`Réf : ${config.reference}`, rightX, currentY + 32);
      safeText(`Date : ${config.date || new Date().toLocaleDateString()}`, rightX, currentY + 39);

      // --- CLIENT BLOCK (dynamique) ---
      const clientBlockX = rightX;
      const clientBlockYStart = currentY + 50;
      const maxClientWidth = pageWidth - clientBlockX - marginRight - 5;

      let requiredWidth = 0;
      let processedInfo: { lines: string[] }[] = [];

      config.generalInfo?.forEach((info) => {
        const label = this.translationService.instant(info.label);
        const value = info.value || '';
        const fullText = `${label} : ${value}`;
        const lines = doc.splitTextToSize(fullText, maxClientWidth - clientPadding * 2);
        lines.forEach((line: string) => {
          const textWidth = doc.getTextWidth(line);
          if (textWidth > requiredWidth) {
            requiredWidth = textWidth;
          }
        });
        processedInfo.push({lines});
      });

      const clientBlockWidth = Math.min(requiredWidth + 8, maxClientWidth);
      const clientBlockHeight = 6 + processedInfo.reduce((acc, info) => acc + info.lines.length * lineHeight, 0);

      // Dessiner le rectangle
      doc.setFillColor(245, 245, 245);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight, 'FD');
      doc.setDrawColor(0);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight);

      // Titre
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeSmall);
      safeText(this.translationService.instant('PDF.CLIENT_INFO'), clientBlockX + clientPadding, clientBlockYStart + 6);

      // Texte multiligne
      doc.setFont(this._fontName, 'normal');
      let textY = clientBlockYStart + 12;
      processedInfo.forEach(info => {
        info.lines.forEach(line => {
          safeText(line, clientBlockX + clientPadding, textY);
          textY += lineHeight;
        });
      });

      // --- TABLEAU DES PAIEMENTS ---
      currentY = clientBlockYStart + clientBlockHeight + 20;

      const col1Width = 35; // Type paiement
      const col2Width = 35; // Total facture
      const col3Width = 30; // Payé
      const col4Width = 35; // Date paiement
      const col5Width = 35; // Reste à payer
      const tableWidth = col1Width + col2Width + col3Width + col4Width + col5Width;
      const tableLeft = (pageWidth - tableWidth) / 2;

      // En-têtes
      doc.setFillColor(200, 200, 200);
      [col1Width, col2Width, col3Width, col4Width, col5Width].reduce((x, w) => {
        doc.rect(x, currentY, w, rowHeight, 'FD');
        return x + w;
      }, tableLeft);

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeSmall);
      safeText(this.translationService.instant('PDF.PAYMENT_TYPE'), tableLeft + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.TOTAL_AMOUNT'), tableLeft + col1Width + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.PAID_AMOUNT'), tableLeft + col1Width + col2Width + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.PAYMENT_DATE'), tableLeft + col1Width + col2Width + col3Width + 2, currentY + 6);
      safeText(this.translationService.instant('PDF.REMAINING_AMOUNT'), tableLeft + col1Width + col2Width + col3Width + col4Width + 2, currentY + 6);

      // Lignes de données
      doc.setFont(this._fontName, 'normal');
      config.paymentDetails.forEach((item) => {
        currentY += rowHeight;

        // Bordures
        let colX = tableLeft;
        [col1Width, col2Width, col3Width, col4Width, col5Width].forEach((w) => {
          doc.rect(colX, currentY, w, rowHeight);
          colX += w;
        });

        // Positions colonnes
        const totalX = tableLeft + col1Width;
        const paidX = totalX + col2Width;
        const dateX = paidX + col3Width;
        const remainX = dateX + col4Width;

        // Texte
        const paymentTypeLines = doc.splitTextToSize(item.paymentType, col1Width - 4);
        safeText(paymentTypeLines[0], tableLeft + 2, currentY + 6);

        const totalWidth = doc.getTextWidth(item.totalAmount);
        const paidWidth = doc.getTextWidth(item.paidAmount);
        const remainingWidth = doc.getTextWidth(item.remainingAmount);

        safeText(item.totalAmount, totalX + col2Width - totalWidth - 2, currentY + 6);
        safeText(item.paidAmount, paidX + col3Width - paidWidth - 2, currentY + 6);
        safeText(item.paymentDate, dateX + 2, currentY + 6); // aligné à gauche
        safeText(item.remainingAmount, remainX + col5Width - remainingWidth - 2, currentY + 6); // aligné à droite
      });

      // --- OPEN PDF ---
      window.open(doc.output('bloburl'), '_blank');

    }).catch(err => {
      console.error('Erreur lors du chargement du logo :', err);
      alert('Impossible de générer la note de paiement. Vérifiez que le logo est accessible.');
    });
  }
}

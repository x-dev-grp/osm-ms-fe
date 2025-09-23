import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { TranslateService } from '@ngx-translate/core';
import { PdfFactureConfig, PdfPaymentNoteConfig } from '../models/pdf-config.model';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorFactureService {
  // Optional in-memory preview override (if you set it elsewhere)
  logoPreview: string | null = null;

  private readonly _fontName: 'helvetica' | 'times' | 'courier' = 'helvetica';

  constructor(private translationService: TranslateService) {}

  // ----------------------------
  // Public API
  // ----------------------------

  async generatePdfDocument(config: PdfFactureConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl);
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

      // --- helpers ---
      const safeText = (text: any, x: number, y: number) => {
        const str = text == null || text === 'undefined' ? '' : String(text).trim();
        if (str) doc.text(str, x, y);
      };

      const t = (key: string) => this.translationService.instant(key);

      // --- LOGO ---
      if (base64Logo) {
        // Let jsPDF auto-detect format from data URL if possible
        try {
          doc.addImage(base64Logo, undefined as any, marginLeft, currentY, logoWidth, logoHeight);
        } catch {
          // Fallback to JPEG
          doc.addImage(base64Logo, 'JPEG', marginLeft, currentY, logoWidth, logoHeight);
        }
      }

      // --- COMPANY INFO (left) ---
      const companyInfoX = marginLeft + 10;
      const companyInfoYStart = currentY + 25;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fontSizeSmall);

      safeText(config.companyInfo?.companyName || t('PDF.COMPANY_NAME'), companyInfoX, companyInfoYStart);
      safeText(config.companyInfo?.address || t('PDF.ADDRESS'), companyInfoX, companyInfoYStart + lineHeight);

      if (config.companyInfo?.vatNumber) {
        safeText(`VAT: ${config.companyInfo.vatNumber}`, companyInfoX, companyInfoYStart + 2 * lineHeight);
      }
      if (config.companyInfo?.mobile) {
        safeText(`Mobile: ${config.companyInfo.mobile}`, companyInfoX, companyInfoYStart + 3 * lineHeight);
      }
      if (config.companyInfo?.website) {
        safeText(`Website: ${config.companyInfo.website}`, companyInfoX, companyInfoYStart + 4 * lineHeight);
      }

      // --- TITLE & REF (right) ---
      doc.setFontSize(fontSizeLarge);
      doc.setFont(this._fontName, 'bold');
      safeText(config.title || 'FACTURE', rightX, currentY + 25);

      doc.setFontSize(fontSizeMedium);
      doc.setFont(this._fontName, 'normal');
      safeText(`${t('PDF.REFERENCE')} : ${config.reference}`, rightX, currentY + 32);
      safeText(`${t('PDF.DATE')} : ${config.date || new Date().toLocaleDateString()}`, rightX, currentY + 39);

      // --- CLIENT INFO (dynamic block) ---
      const clientBlockX = rightX;
      const clientBlockYStart = currentY + 45;
      const clientBlockWidth = pageWidth - clientBlockX - marginRight;
      const clientPadding = 4;

      const clientInfos = (config.generalInfo || []).filter((info) => info && info.value != null && String(info.value).trim() !== '');

      let dynamicHeight = 6; // includes title margin
      const processedInfos: { text: string[] }[] = [];

      clientInfos.forEach((info) => {
        const label = t(info.label);
        const value = info.value || '';
        const fullText = `${label} : ${value}`;
        const wrappedText = doc.splitTextToSize(fullText, clientBlockWidth - 2 * clientPadding);
        processedInfos.push({ text: wrappedText });
        dynamicHeight += wrappedText.length * lineHeight;
      });

      const clientBlockHeight = processedInfos.length > 0 ? dynamicHeight + 4 : 0;

      if (processedInfos.length > 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight, 'FD');
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight);

        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fontSizeSmall);
        safeText(t('PDF.CLIENT_INFO'), clientBlockX + clientPadding, clientBlockYStart + 6);

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fontSizeSmall);

        let yOffset = clientBlockYStart + 12;
        processedInfos.forEach((info) => {
          info.text.forEach((line) => {
            safeText(line, clientBlockX + clientPadding, yOffset);
            yOffset += lineHeight;
          });
        });
      }

      // Move Y after block
      currentY = clientBlockYStart + clientBlockHeight + 15;

      // --- TABLE HEADER ---
      const tableLeft = marginLeft;
      const col1Width = 100; // description
      const col2Width = 30; // unit price
      const col3Width = 30; // quantity
      const col4Width = 30; // total

      doc.setFillColor(200, 200, 200);
      doc.rect(tableLeft, currentY, col1Width, 10, 'FD');
      doc.rect(tableLeft + col1Width, currentY, col2Width, 10, 'FD');
      doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, 10, 'FD');
      doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, 10, 'FD');

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeSmall);
      safeText(t('PDF.DESCRIPTION'), tableLeft + 2, currentY + 6);
      safeText(t('PDF.PRICE_UNIT'), tableLeft + col1Width + 2, currentY + 6);
      safeText(t('PDF.QUANTITY'), tableLeft + col1Width + col2Width + 2, currentY + 6);
      safeText(t('PDF.TOTAL'), tableLeft + col1Width + col2Width + col3Width + 2, currentY + 6);

      currentY += 10;

      // --- TABLE ROW (single consolidated line based on fields) ---
      let totalValue = 0;

      const fields = config.fields || [];
      const getVal = (key: string) => fields.find((f) => f.label === key)?.value ?? '';

      const description = String(getVal('PDF.DESCRIPTION'));
      const unitPriceNum = this.parseNumberFrom(getVal('PDF.PRICE_UNIT')); // expects like "9.500 TND/kg"
      const quantityNum = this.parseNumberFrom(getVal('PDF.QUANTITY')); // expects like "100 kg"
      const amount = unitPriceNum * quantityNum;
      totalValue = isNaN(amount) ? 0 : amount;

      // draw one row if content exists
      if (description || unitPriceNum || quantityNum) {
        doc.rect(tableLeft, currentY, col1Width, rowHeight);
        doc.rect(tableLeft + col1Width, currentY, col2Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width, currentY, col3Width, rowHeight);
        doc.rect(tableLeft + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight);

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fontSizeSmall);
        safeText(description, tableLeft + 2, currentY + 5);
        safeText(`${unitPriceNum.toFixed(2)} TND/kg`, tableLeft + col1Width + 2, currentY + 5);
        safeText(`${quantityNum.toFixed(2)} kg`, tableLeft + col1Width + col2Width + 2, currentY + 5);
        safeText(`${totalValue.toFixed(2)} TND`, tableLeft + col1Width + col2Width + col3Width + 2, currentY + 5);

        currentY += rowHeight;
      }

      // --- FINAL TOTAL (box) ---
      const totalX = tableLeft + col1Width + col2Width + col3Width;
      const totalY = currentY;
      const col4WidthBox = 30;

      doc.setLineWidth(0.5);
      doc.rect(totalX, totalY, col4WidthBox, rowHeight);
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeMedium);
      safeText(`${totalValue.toFixed(2)} TND`, totalX + 2, totalY + 5);

      // --- OPEN PDF ---
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Erreur lors de la génération de la facture :', err);
      alert('Impossible de générer la facture.');
    }
  }

  async generatePdfNoteDocument(config: PdfPaymentNoteConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl); // tolerate absent in interface
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
      const t = (key: string) => this.translationService.instant(key);

      // --- LOGO ---
      if (base64Logo) {
        try {
          doc.addImage(base64Logo, undefined as any, marginLeft, currentY, logoWidth, logoHeight);
        } catch {
          doc.addImage(base64Logo, 'JPEG', marginLeft, currentY, logoWidth, logoHeight);
        }
      }

      // --- COMPANY INFO (left) ---
      const companyInfoX = marginLeft + 10;
      const companyInfoYStart = currentY + 25;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fontSizeSmall);
      safeText(config.companyInfo.companyName || t('PDF.COMPANY_NAME'), companyInfoX, companyInfoYStart);
      safeText(config.companyInfo.address || t('PDF.ADDRESS'), companyInfoX, companyInfoYStart + lineHeight);
      safeText(`${t('PDF.VAT')} ${config.companyInfo.vatNumber || t('PDF.VAT')}`, companyInfoX, companyInfoYStart + 2 * lineHeight);
      safeText(`${t('PDF.MOBILE')} ${config.companyInfo.mobile || t('PDF.MOBILE')}`, companyInfoX, companyInfoYStart + 3 * lineHeight);
      safeText(`${t('PDF.WEBSITE')} ${config.companyInfo.website || t('PDF.WEBSITE')}`, companyInfoX, companyInfoYStart + 4 * lineHeight);

      // --- TITLE & REF (right) ---
      doc.setFontSize(fontSizeLarge);
      doc.setFont(this._fontName, 'bold');
      const translatedTitle = config.title ? t(config.title) : t('PDF.NOTE_PAYEMENT_RECEPTION');
      safeText(translatedTitle, rightX, currentY + 25);

      doc.setFontSize(fontSizeMedium);
      doc.setFont(this._fontName, 'normal');
      safeText(`${t('PDF.REFERENCE')} : ${config.reference}`, rightX, currentY + 32);
      safeText(`${t('PDF.DATE')} : ${config.date || new Date().toLocaleDateString()}`, rightX, currentY + 39);

      // --- CLIENT BLOCK (dynamic) ---
      const clientBlockX = rightX;
      const clientBlockYStart = currentY + 50;
      const maxClientWidth = pageWidth - clientBlockX - marginRight - 5;

      let requiredWidth = 0;
      const processedInfo: { lines: string[] }[] = [];

      (config.generalInfo || []).forEach((info) => {
        const label = t(info.label);
        const value = info.value || '';
        const fullText = `${label} : ${value}`;
        const lines = doc.splitTextToSize(fullText, maxClientWidth - clientPadding * 2);
        lines.forEach((line: string) => {
          const textWidth = doc.getTextWidth(line);
          if (textWidth > requiredWidth) requiredWidth = textWidth;
        });
        processedInfo.push({ lines });
      });

      const clientBlockWidth = Math.min(requiredWidth + 8, maxClientWidth);
      const clientBlockHeight = 6 + processedInfo.reduce((acc, cur) => acc + cur.lines.length * lineHeight, 0);

      doc.setFillColor(245, 245, 245);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight, 'FD');
      doc.setDrawColor(0);
      doc.rect(clientBlockX, clientBlockYStart, clientBlockWidth, clientBlockHeight);

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeSmall);
      safeText(t('PDF.CLIENT_INFO'), clientBlockX + clientPadding, clientBlockYStart + 6);

      doc.setFont(this._fontName, 'normal');
      let textY = clientBlockYStart + 12;
      processedInfo.forEach((info) => {
        info.lines.forEach((line) => {
          safeText(line, clientBlockX + clientPadding, textY);
          textY += lineHeight;
        });
      });

      // --- PAYMENTS TABLE ---
      currentY = clientBlockYStart + clientBlockHeight + 20;

      const col1Width = 35; // payment type
      const col2Width = 35; // total
      const col3Width = 30; // paid
      const col4Width = 35; // payment date
      const col5Width = 35; // remaining
      const tableWidth = col1Width + col2Width + col3Width + col4Width + col5Width;
      const tableLeft = (pageWidth - tableWidth) / 2;

      doc.setFillColor(200, 200, 200);
      [col1Width, col2Width, col3Width, col4Width, col5Width].reduce((x, w) => {
        doc.rect(x, currentY, w, rowHeight, 'FD');
        return x + w;
      }, tableLeft);

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fontSizeSmall);
      safeText(t('PDF.PAYMENT_TYPE'), tableLeft + 2, currentY + 6);
      safeText(t('PDF.TOTAL_AMOUNT'), tableLeft + col1Width + 2, currentY + 6);
      safeText(t('PDF.PAID_AMOUNT'), tableLeft + col1Width + col2Width + 2, currentY + 6);
      safeText(t('PDF.PAYMENT_DATE'), tableLeft + col1Width + col2Width + col3Width + 2, currentY + 6);
      safeText(t('PDF.REMAINING_AMOUNT'), tableLeft + col1Width + col2Width + col3Width + col4Width + 2, currentY + 6);

      doc.setFont(this._fontName, 'normal');
      (config.paymentDetails || []).forEach((item) => {
        currentY += rowHeight;

        // borders
        let colX = tableLeft;
        [col1Width, col2Width, col3Width, col4Width, col5Width].forEach((w) => {
          doc.rect(colX, currentY, w, rowHeight);
          colX += w;
        });

        // positions
        const totalX = tableLeft + col1Width;
        const paidX = totalX + col2Width;
        const dateX = paidX + col3Width;
        const remainX = dateX + col4Width;

        // text
        const paymentTypeLines = doc.splitTextToSize(item.paymentType, col1Width - 4);
        safeText(paymentTypeLines[0], tableLeft + 2, currentY + 6);

        const totalWidth = doc.getTextWidth(item.totalAmount);
        const paidWidth = doc.getTextWidth(item.paidAmount);
        const remainingWidth = doc.getTextWidth(item.remainingAmount);

        safeText(item.totalAmount, totalX + col2Width - totalWidth - 2, currentY + 6);
        safeText(item.paidAmount, paidX + col3Width - paidWidth - 2, currentY + 6);
        safeText(item.paymentDate, dateX + 2, currentY + 6); // left-aligned
        safeText(item.remainingAmount, remainX + col5Width - remainingWidth - 2, currentY + 6); // right-aligned
      });

      // --- OPEN PDF ---
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Erreur lors de la génération de la note de paiement :', err);
      alert('Impossible de générer la note de paiement.');
    }
  }

  // ----------------------------
  // Internals
  // ----------------------------

  /**
   * Choose the appropriate logo source:
   * 1) config.companyInfo.logoUrl (if provided)
   * 2) this.logoPreview (if set)
   * 3) fallback to 'assets/logo.jpg'
   * Returns a data URL or null.
   */
  // 1) pickLogo: choose source and normalize to a valid data URL when possible
  private async pickLogo(companyLogoUrl?: string): Promise<string | null> {
    const candidate = companyLogoUrl || this.logoPreview || 'assets/logo.jpg';

    // If we can normalize it right away to a data URL, do it and return.
    const normalized = this.normalizeToDataUrl(candidate);
    if (normalized) return normalized;

    // Otherwise, load via fetch→blob→dataURL (or <img> fallback for same-origin assets)
    try {
      return await this.getImageAsDataUrl(candidate);
    } catch (e) {
      // Last resort: no logo
      return null;
    }
  }

  // 2) normalizeToDataUrl: handle raw base64 or malformed data URLs (like your "data:ivBORw0..." case)
  private normalizeToDataUrl(input: string): string | null {
    if (!input) return null;

    // Already a proper image data URL
    if (input.startsWith('data:image/')) return input;

    // Malformed data URL (missing mime/type). Convert to PNG data URL.
    if (input.startsWith('data:')) {
      // If there's no comma, assume the whole tail is base64 payload
      if (!input.includes(',')) {
        const payload = input.slice('data:'.length);
        return `data:image/png;base64,${payload}`;
      }
      // If there is a comma but wrong/unknown header, replace header with image/png
      const commaIdx = input.indexOf(',');
      const payload = input.slice(commaIdx + 1);
      // Heuristic: if header doesn’t specify ";base64", assume it is base64 anyway
      return `data:image/png;base64,${payload}`;
    }

    // Pure base64 (no "data:" prefix). Heuristic check.
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64Regex.test(input)) {
      return `data:image/png;base64,${input}`;
    }

    // Not a data URL nor raw base64 → must be a normal URL; let caller handle it.
    return null;
  }

  // 3) getImageAsDataUrl: unchanged logic, but now only called for "real" URLs
  private async getImageAsDataUrl(url: string): Promise<string> {
    // Try fetch → blob → dataURL first (best for CORS-safe conversion)
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      });
      return dataUrl;
    } catch {
      // Fallback to <img> + canvas (works for same-origin / assets/*)
      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('2D context not available'));
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
      });
    }
  }

  /**
   * Parse a number from a string like "9.500 TND/kg" or "100 kg".
   * Keeps only the first valid numeric token.
   */
  private parseNumberFrom(value: string): number {
    if (!value) return 0;
    // Replace commas with dots, strip non-number except dot and minus
    const match = String(value)
      .replace(',', '.')
      .match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }
}

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { TranslateService } from '@ngx-translate/core';
import { PdfFactureConfig, PdfInvoiceLineItem, PdfPaymentNoteConfig } from '../models/pdf-config.model';
import {
  TUNISIA_VAT_LEGAL_MENTION_KEY,
  TUNISIA_VAT_STANDARD_RATE
} from '../constants/tunisia-vat.constants';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorFactureService {
  // Optional in-memory preview override (if you set it elsewhere)
  logoPreview: string | null = null;

  private readonly _fontName: 'helvetica' | 'times' | 'courier' = 'helvetica';

  constructor(private translationService: TranslateService) {}

  // ============================================================
  // FACTURE (Invoice) – canonical commercial layout (FACTURE SUISSE)
  // ============================================================
  async generatePdfDocument(config: PdfFactureConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const pageWidth = 210;
      const marginLeft = 12;
      const marginRight = 12;
      const contentWidth = pageWidth - marginLeft - marginRight;
      const rightMetaX = pageWidth - marginRight;
      const fsS = 9;
      const fsM = 10;
      const fsL = 12;
      const lineStep = 4.5;
      const currency = (config.currency || 'TND').toUpperCase();
      const defaultVat =
        config.defaultVatRatePercent ??
        (currency === 'EURO' || currency === 'EUR' ? 0 : TUNISIA_VAT_STANDARD_RATE);

      const t = (key: string) => this.translationService.instant(key);
      const norm = (v: unknown) => (v == null || v === 'undefined' ? '' : String(v).trim());
      const safeText = (
        text: unknown,
        x: number,
        y: number,
        align: 'left' | 'right' | 'center' = 'left'
      ) => {
        const str = norm(text);
        if (str) doc.text(str, x, y, { align });
      };
      const drawWrapped = (
        text: unknown,
        x: number,
        y: number,
        maxWidth: number,
        step = lineStep,
        align: 'left' | 'right' | 'center' = 'left'
      ): number => {
        const str = norm(text);
        if (!str) return y;
        const lines = doc.splitTextToSize(str, maxWidth);
        lines.forEach((ln: string, i: number) => doc.text(ln, x, y + i * step, { align }));
        return y + lines.length * step;
      };

      const headerTopY = 12;
      const logoW = 38;
      const logoH = 38;
      const leftColW = 96;

      // ---------- TOP LEFT: logo + company ----------
      if (base64Logo) {
        try {
          doc.addImage(base64Logo, undefined as any, marginLeft, headerTopY, logoW, logoH);
        } catch {
          doc.addImage(base64Logo, 'JPEG', marginLeft, headerTopY, logoW, logoH);
        }
      }

      let companyY = headerTopY + logoH + 3;
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsM);
      companyY = drawWrapped(config.companyInfo?.companyName, marginLeft, companyY, leftColW);

      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      companyY = drawWrapped(config.companyInfo?.address, marginLeft, companyY, leftColW);
      if (config.companyInfo?.vatNumber) {
        companyY = drawWrapped(`${t('PDF.TAX_ID')}: ${config.companyInfo.vatNumber}`, marginLeft, companyY, leftColW);
      }
      if (config.companyInfo?.mobile) {
        companyY = drawWrapped(`${t('PDF.MOBILE')} ${config.companyInfo.mobile}`, marginLeft, companyY, leftColW);
      }
      if (config.companyInfo?.website) {
        companyY = drawWrapped(config.companyInfo.website, marginLeft, companyY, leftColW);
      }

      const companyBottom = companyY;

      // ---------- TOP RIGHT: title + invoice meta ----------
      const titleKey = config.title || 'PDF.COMMERCIAL_INVOICE';
      const titleText = titleKey.startsWith('PDF.') ? t(titleKey) : titleKey;
      const conditions = this.resolveConditions(config);

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsL);
      safeText(titleText, rightMetaX, headerTopY + 8, 'right');

      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      let metaY = headerTopY + 16;
      safeText(config.reference || '', rightMetaX, metaY, 'right');
      metaY += lineStep + 1;
      safeText(this.formatInvoiceDate(config.date), rightMetaX, metaY, 'right');
      if (conditions) {
        metaY += lineStep + 1;
        safeText(`${t('PDF.CONDITIONS')}: ${conditions}`, rightMetaX, metaY, 'right');
      }

      // ---------- CLIENT BOX (name + address only) ----------
      const clientLines = this.resolveClientLines(config);
      const clientBlockX = marginLeft;
      const clientBlockY = companyBottom + 8;
      const clientBlockW = leftColW;
      const pad = 4;

      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      let clientContentH = 0;
      clientLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, clientBlockW - pad * 2);
        clientContentH += lines.length * lineStep;
      });

      const clientBlockH = clientContentH + pad * 2;
      doc.setDrawColor(0);
      doc.rect(clientBlockX, clientBlockY, clientBlockW, clientBlockH, 'D');

      let clientTextY = clientBlockY + pad + 3;
      clientLines.forEach((line) => {
        clientTextY = drawWrapped(line, clientBlockX + pad, clientTextY, clientBlockW - pad * 2);
      });

      let currentY = clientBlockY + clientBlockH + 10;

      // ---------- PRODUCTS TABLE (Tunisia TVA: HT + rate + VAT + TTC per line) ----------
      const tableLeft = marginLeft;
      const cols = [
        { w: 52 },
        { w: 24 },
        { w: 18 },
        { w: 24 },
        { w: 14 },
        { w: 24 },
        { w: 24 }
      ];
      const colX: number[] = [tableLeft];
      for (let i = 0; i < cols.length - 1; i++) colX.push(colX[i] + cols[i].w);

      const headerH = 9;
      const lineItems = this.resolveLineItems(config);
      const taxTotals = { ht: 0, vat: 0, ttc: 0 };

      cols.forEach((c, i) => doc.rect(colX[i], currentY, c.w, headerH));

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsS);
      const priceUnitSuffix = this.resolvePriceUnitSuffix(lineItems);
      safeText(t('PDF.DESCRIPTION'), colX[0] + cols[0].w / 2, currentY + 6, 'center');
      safeText(`${t('PDF.UNIT_PRICE_HT')} ${currency}${priceUnitSuffix}`, colX[1] + cols[1].w / 2, currentY + 6, 'center');
      safeText(t('PDF.QUANTITY'), colX[2] + cols[2].w / 2, currentY + 6, 'center');
      safeText(`${t('PDF.AMOUNT_HT')} ${currency}`, colX[3] + cols[3].w / 2, currentY + 6, 'center');
      safeText(t('PDF.VAT_RATE'), colX[4] + cols[4].w / 2, currentY + 6, 'center');
      safeText(`${t('PDF.VAT_AMOUNT')} ${currency}`, colX[5] + cols[5].w / 2, currentY + 6, 'center');
      safeText(`${t('PDF.TOTAL_TTC')} ${currency}`, colX[6] + cols[6].w / 2, currentY + 6, 'center');

      currentY += headerH;
      doc.setFont(this._fontName, 'normal');

      lineItems.forEach((item) => {
        const line = this.computeLineTax(item, defaultVat);
        taxTotals.ht += line.ht;
        taxTotals.vat += line.vat;
        taxTotals.ttc += line.ttc;

        const descLines = doc.splitTextToSize(item.description || '', cols[0].w - 4);
        const rowH = Math.max(8, descLines.length * lineStep + 3);

        cols.forEach((c, i) => doc.rect(colX[i], currentY, c.w, rowH));

        descLines.forEach((ln: string, i: number) => {
          safeText(ln, colX[0] + 2, currentY + 5 + i * lineStep);
        });

        safeText(
          isFinite(item.unitPrice) && item.unitPrice !== 0 ? this.formatMoney(item.unitPrice, currency) : '',
          colX[1] + cols[1].w / 2,
          currentY + 5,
          'center'
        );
        safeText(
          isFinite(item.quantity) && item.quantity !== 0
            ? this.formatQtyWithUnit(item.quantity, item.unit)
            : '',
          colX[2] + cols[2].w / 2,
          currentY + 5,
          'center'
        );
        safeText(this.formatMoney(line.ht, currency), colX[3] + cols[3].w / 2, currentY + 5, 'center');
        safeText(this.formatQty(line.vatRate), colX[4] + cols[4].w / 2, currentY + 5, 'center');
        safeText(this.formatMoney(line.vat, currency), colX[5] + cols[5].w / 2, currentY + 5, 'center');
        safeText(this.formatMoney(line.ttc, currency), colX[6] + cols[6].w / 2, currentY + 5, 'center');

        currentY += rowH;
      });

      currentY += 4;

      // ---------- TVA SUMMARY ----------
      const summaryX = pageWidth - marginRight;
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsS);
      safeText(`${t('PDF.SUBTOTAL_HT')} ${currency}: ${this.formatMoney(taxTotals.ht, currency)}`, summaryX, currentY, 'right');
      currentY += lineStep + 1;
      safeText(`${t('PDF.TOTAL_VAT')} ${currency}: ${this.formatMoney(taxTotals.vat, currency)}`, summaryX, currentY, 'right');
      currentY += lineStep + 1;
      if (config.suspendedVatAmount && config.suspendedVatAmount > 0) {
        safeText(
          `${t('PDF.SUSPENDED_VAT')} ${currency}: ${this.formatMoney(config.suspendedVatAmount, currency)}`,
          summaryX,
          currentY,
          'right'
        );
        currentY += lineStep + 1;
      }
      doc.setFontSize(fsM);
      safeText(`${t('PDF.TOTAL_TTC')} ${currency}: ${this.formatMoney(taxTotals.ttc, currency)}`, summaryX, currentY, 'right');
      currentY += lineStep + 4;

      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(8);
      currentY = drawWrapped(t(TUNISIA_VAT_LEGAL_MENTION_KEY), marginLeft, currentY, contentWidth);
      currentY += 6;

      // ---------- LOGISTICS (below table, left) ----------
      const add = config.additionalInfo || {};
      const logisticsLines: string[] = [];
      if (add.grossWeight) {
        logisticsLines.push(`${t('PDF.GROSS_WEIGHT_TOTAL')}: ${add.grossWeight}`);
      }
      if (add.netWeight) {
        logisticsLines.push(`${t('PDF.NET_WEIGHT_TOTAL')}: ${add.netWeight}`);
      }
      if (add.packages) {
        logisticsLines.push(`${t('PDF.NUMBER_OF_PACKAGES')}: ${add.packages}`);
      }
      if (add.incoterm) {
        logisticsLines.push(`${t('PDF.INCOTERM')}: ${add.incoterm}`);
      }
      if (add.deliveryAddress) {
        logisticsLines.push(`${t('PDF.DELIVERY_ADDRESS')}: ${add.deliveryAddress}`);
      }

      const blockLeftW = 96;
      const blockRightX = marginLeft + blockLeftW + 8;
      const blockRightW = contentWidth - blockLeftW - 8;

      let leftBottomY = currentY;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      logisticsLines.forEach((ln) => {
        leftBottomY = drawWrapped(ln, marginLeft, leftBottomY, blockLeftW);
      });

      // ---------- BANK DETAILS (right column) ----------
      const bank = config.bankInfo || {};
      let rightBottomY = currentY;
      if (bank.bankName || bank.iban || bank.swiftCode) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.BANK_DETAILS'), blockRightX, rightBottomY);
        rightBottomY += lineStep;

        doc.setFont(this._fontName, 'normal');
        if (bank.bankName) {
          rightBottomY = drawWrapped(`${t('PDF.BANK')}: ${bank.bankName}`, blockRightX, rightBottomY, blockRightW);
        }
        if (bank.iban) {
          rightBottomY = drawWrapped(`IBAN: ${bank.iban}`, blockRightX, rightBottomY, blockRightW);
        }
        if (bank.swiftCode) {
          rightBottomY = drawWrapped(`${t('PDF.SWIFT_CODE')}: ${bank.swiftCode}`, blockRightX, rightBottomY, blockRightW);
        }
      }

      currentY = Math.max(leftBottomY, rightBottomY) + 6;

      // ---------- PAYMENT TERMS ----------
      const termsList = config.paymentTerms || [];
      if (termsList.length) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.PAYMENT_TERMS'), marginLeft, currentY);
        currentY += lineStep;

        doc.setFont(this._fontName, 'normal');
        termsList.forEach((term) => {
          currentY = drawWrapped(`• ${term}`, marginLeft, currentY, contentWidth);
        });
        currentY += 2;
      }

      // ---------- FOOTER (bottom-left) ----------
      const fc = config.footerContact || {};
      const footerY = 285;
      let footY = footerY;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      if (fc.companyName || config.companyInfo?.companyName) {
        footY = drawWrapped(fc.companyName || config.companyInfo?.companyName, marginLeft, footY, leftColW);
      }
      if (fc.name) {
        footY = drawWrapped(fc.name, marginLeft, footY, leftColW);
      }
      if (fc.phone) {
        drawWrapped(`${t('PDF.MOBILE')} ${fc.phone}`, marginLeft, footY, leftColW);
      }

      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Erreur lors de la génération de la facture :', err);
      alert(this.translationService.instant('AUTO.IMPOSSIBLE_DE_GENERER_LA_FACTURE'));
    }
  }

  // ============================================================
  // NOTE DE PAIEMENT (kept; uses a simple centered table)
  // ============================================================
  async generatePdfNoteDocument(config: PdfPaymentNoteConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl); // tolerate absent in interface
      const doc = new jsPDF();
      let currentY = 10;
      const marginLeft = 10;
      const marginRight = 10;
      const pageWidth = 210;
      const logoWidth = 25;
      const logoHeight = 25;
      const rightX = pageWidth - 100;
      const fontSizeSmall = 9;
      const fontSizeMedium = 10;
      const fontSizeLarge = 12;
      const rowHeight = 10;
      const lineHeight = 7;
      const clientPadding = 4;

      const t = (key: string) => this.translationService.instant(key);
      const norm = (v: any) => (v == null || v === 'undefined' ? '' : String(v).trim());

      const safeText = (text: any, x: number, y: number) => {
        const str = norm(text);
        if (str) doc.text(str, x, y);
      };

      // helper: wrap text to a max width and render; returns the y after the drawn block
      const drawWrapped = (txt: any, x: number, y: number, maxWidth: number, lh = lineHeight) => {
        const str = norm(txt);
        if (!str) return y;
        const lines = doc.splitTextToSize(str, maxWidth);
        lines.forEach((ln: string, i: any) => doc.text(ln, x, y + i * lh));
        return y + lines.length * lh;
      };

      // --- LOGO ---
      if (base64Logo) {
        try {
          doc.addImage(base64Logo, undefined as any, marginLeft, currentY, logoWidth, logoHeight);
        } catch {
          doc.addImage(base64Logo, 'JPEG', marginLeft, currentY, logoWidth, logoHeight);
        }
      }

      // --- COMPANY INFO (left) ---
      // we keep your positions, but wrap within the left column width
      const companyInfoX = marginLeft + 10; // 20
      const companyInfoYStart = currentY + 25; // ~35
      const leftColumnMaxWidth = rightX - companyInfoX - 6; // space up to the right column

      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fontSizeSmall);

      // Start drawing each line but wrapped to the available width
      let yPtr = companyInfoYStart;
      yPtr = drawWrapped(config.companyInfo?.companyName || t('PDF.COMPANY_NAME'), companyInfoX, yPtr, leftColumnMaxWidth);
      yPtr = drawWrapped(config.companyInfo?.address || t('PDF.ADDRESS'), companyInfoX, yPtr, leftColumnMaxWidth);

      // For the “label + value” lines, build a single string and wrap it too
      yPtr = drawWrapped(`${t('PDF.VAT')} ${config.companyInfo?.vatNumber || t('PDF.VAT')}`, companyInfoX, yPtr, leftColumnMaxWidth);
      yPtr = drawWrapped(`${t('PDF.MOBILE')} ${config.companyInfo?.mobile || t('PDF.MOBILE')}`, companyInfoX, yPtr, leftColumnMaxWidth);
      yPtr = drawWrapped(`${t('PDF.WEBSITE')} ${config.companyInfo?.website || t('PDF.WEBSITE')}`, companyInfoX, yPtr, leftColumnMaxWidth);

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

      // PAYMENTS TABLE (centered)
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
        safeText(paymentTypeLines[0], tableLeft + 2, currentY + 6); // keep one line to preserve your row height

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
      alert(this.translationService.instant('AUTO.IMPOSSIBLE_DE_GENERER_LA_NOTE_DE_PAIEMENT'));
    }
  }

  // ----------------------------
  // Internals
  // ----------------------------

  /** Select logo source and normalize to a data URL if possible. */
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

  private resolveConditions(config: PdfFactureConfig): string {
    if (config.conditions) return config.conditions;
    const op = (config.generalInfo || []).find((g) => g.label === 'PDF.OPERATION_TYPE');
    return op?.value ? String(op.value).trim() : '';
  }

  private resolveClientLines(config: PdfFactureConfig): string[] {
    if (config.clientInfo) {
      const lines: string[] = [];
      if (config.clientInfo.name) lines.push(config.clientInfo.name);
      if (config.clientInfo.taxId) {
        lines.push(`${this.translationService.instant('PDF.TAX_ID')}: ${config.clientInfo.taxId}`);
      }
      (config.clientInfo.addressLines || []).forEach((l) => {
        if (l?.trim()) lines.push(l.trim());
      });
      if (lines.length) return lines;
    }

    const clientLabels = new Set([
      'PDF.CLIENT',
      'PDF.CUSTOMER',
      'PDF.CLIENT_NAME',
      'PDF.ADDRESS',
      'PDF.CLIENT_ADDRESS',
      'PDF.PHONE',
      'PDF.CLIENT_PHONE',
      'PDF.REGION'
    ]);
    const skip = new Set([
      'PDF.OPERATION_TYPE',
      'PDF.INVOICE_NUMBER',
      'PDF.LOT_NUMBER',
      'PDF.REFERENCE_DATE',
      'PDF.INVOICE_DATE',
      'PDF.DELIVERY_DATE',
      'PDF.SALE_DATE'
    ]);

    return (config.generalInfo || [])
      .filter((g) => g?.value && String(g.value).trim() && !skip.has(g.label))
      .filter((g) => clientLabels.has(g.label))
      .map((g) => String(g.value).trim());
  }

  private resolveLineItems(config: PdfFactureConfig): PdfInvoiceLineItem[] {
    if (config.lineItems?.length) {
      const defaultRate = config.defaultVatRatePercent ?? TUNISIA_VAT_STANDARD_RATE;
      return config.lineItems.map((item) => ({
        ...item,
        vatRatePercent: item.vatRatePercent ?? defaultRate
      }));
    }

    const paymentLabels = new Set([
      'PDF.PAID_AMOUNT',
      'PDF.UNPAID_AMOUNT',
      'PDF.PAYMENT_STATUS',
      'PDF.TOTAL_SERVICE_AMOUNT',
      'PDF.TOTAL_AMOUNT',
      'PDF.TOTAL'
    ]);

    const lines = (config.fields || []).filter((f) => !paymentLabels.has(f.label));
    const byLabel: Record<string, string> = {};
    lines.forEach((it) => (byLabel[it.label] = it.value));

    const hasStdFields =
      byLabel['PDF.DESCRIPTION'] != null ||
      byLabel['PDF.SERVICE_DESCRIPTION'] != null ||
      byLabel['PDF.PRICE_UNIT'] != null ||
      byLabel['PDF.QUANTITY'] != null ||
      byLabel['PDF.TOTAL'] != null;

    if (hasStdFields) {
      const desc =
        byLabel['PDF.DESCRIPTION'] ||
        byLabel['PDF.SERVICE_DESCRIPTION'] ||
        this.resolveConditions(config) ||
        '';
      const unitPriceNum = this.parseNumberFrom(byLabel['PDF.PRICE_UNIT'] || '');
      const qtyNum = this.parseNumberFrom(byLabel['PDF.QUANTITY'] || '');
      let totalNum = this.parseNumberFrom(
        byLabel['PDF.TOTAL'] || byLabel['PDF.TOTAL_AMOUNT'] || byLabel['PDF.TOTAL_SERVICE_AMOUNT'] || ''
      );
      if ((!totalNum || Number.isNaN(totalNum)) && isFinite(unitPriceNum) && isFinite(qtyNum)) {
        totalNum = unitPriceNum * qtyNum;
      }
      const translated = this.translationService.instant(desc);
      return [
        {
          description: translated !== desc ? translated : desc,
          unitPrice: unitPriceNum,
          quantity: qtyNum,
          total: totalNum,
          vatRatePercent: config.defaultVatRatePercent ?? TUNISIA_VAT_STANDARD_RATE
        }
      ];
    }

    return lines.map((it) => {
      const { desc, unitPrice, qty, total } = this.parseInvoiceLine(it.label, it.value);
      const translatedDesc = this.translationService.instant(desc);
      return {
        description: translatedDesc !== desc ? translatedDesc : desc,
        unitPrice: unitPrice ?? 0,
        quantity: qty ?? 0,
        total: total ?? undefined,
        vatRatePercent: config.defaultVatRatePercent ?? TUNISIA_VAT_STANDARD_RATE
      };
    });
  }

  private computeLineTax(
    item: PdfInvoiceLineItem,
    defaultVatRate: number
  ): { ht: number; vatRate: number; vat: number; ttc: number } {
    const vatRate = item.vatRatePercent ?? defaultVatRate ?? TUNISIA_VAT_STANDARD_RATE;
    const ht =
      item.total != null && isFinite(item.total)
        ? item.total
        : (item.unitPrice || 0) * (item.quantity || 0);
    const vat = ht * (vatRate / 100);
    return { ht, vatRate, vat, ttc: ht + vat };
  }

  private formatInvoiceDate(date?: string): string {
    const parsed = date ? new Date(date) : new Date();
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return date || new Date().toLocaleDateString('fr-FR');
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

  /**
   * Extract {desc, unitPrice, qty, total} from a line.
   * Example values:
   *  - label: "PET 10 L – Huile ... × 6", value: "118000 × 6 = 708000"
   *  - label: "PET 5 L – ... × 8",      value: "59000 × 8 = 472000"
   *  - label as desc, value may contain unit, qty, total in various formats.
   */
  private parseInvoiceLine(
    label: string,
    value: string
  ): {
    desc: string;
    unitPrice: number | null;
    qty: number | null;
    total: number | null;
  } {
    const desc = (label || '').trim();

    const nums = (value || '').replace(/,/g, '.').match(/-?\d+(\.\d+)?/g) || [];

    let unitPrice: number | null = null;
    let qty: number | null = null;
    let total: number | null = null;

    if (nums.length >= 3) {
      unitPrice = Number(nums[0]);
      qty = Number(nums[1]);
      total = Number(nums[2]);
    } else if (nums.length === 2) {
      unitPrice = Number(nums[0]);
      qty = Number(nums[1]);
      total = null; // compute later
    } else if (nums.length === 1) {
      if (/[x×*]/i.test(value)) {
        qty = Number(nums[0]); // looks like just "× qty"
      } else {
        total = Number(nums[0]); // only a total present
      }
    }

    return { desc, unitPrice, qty, total };
  }

  private formatMoney(n: number, currency = 'TND'): string {
    if (!isFinite(n)) return '0';
    const decimals = currency === 'EURO' || currency === 'EUR' ? 2 : 3;
    let s = n.toFixed(decimals).replace('.', ',');
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (decimals === 3 && s.endsWith(',000')) {
      s = s.slice(0, -4);
    }
    return s;
  }

  private formatQty(n: number): string {
    if (!isFinite(n)) return '0';
    if (Number.isInteger(n)) {
      return n.toString();
    }
    return n.toFixed(2).replace('.', ',');
  }

  private formatQtyWithUnit(quantity: number, unit?: string): string {
    const formatted = this.formatQty(quantity);
    if (!unit) {
      return formatted;
    }
    return `${formatted} ${unit}`;
  }

  private resolvePriceUnitSuffix(lineItems: PdfInvoiceLineItem[]): string {
    const unit = lineItems.find((item) => item.unit)?.unit;
    return unit ? `/${unit}` : '';
  }
}

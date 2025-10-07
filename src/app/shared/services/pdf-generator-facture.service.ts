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

  // ============================================================
  // FACTURE (Invoice) – matches sample layout:
  // Client block LEFT, company/title block RIGHT,
  // perfectly aligned table + right-locked grand total.
  // ============================================================
  async generatePdfDocument(config: PdfFactureConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      // ---------- GRID / CONSTANTS ----------
      const pageWidth = 210;
      const marginLeft = 12;
      const marginRight = 12;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // Two-column header like the sample (client left, company/right on the right)
      const gap = 6;
      const leftColW = 96; // left column width (client block)
      const rightColW = contentWidth - leftColW - gap;

      const leftColX  = marginLeft;
      const rightColX = marginLeft + leftColW + gap;

      const headerTopY = 12;

      // Fonts
      const fsS = 9, fsM = 10, fsL = 12;

      // Helpers
      const t = (key: string) => this.translationService.instant(key);
      const safeText = (
        text: any,
        x: number,
        y: number,
        align: 'left' | 'right' | 'center' = 'left'
      ) => {
        const str = text == null || text === 'undefined' ? '' : String(text).trim();
        if (str) doc.text(str, x, y, { align });
      };

      // ---------- LEFT COLUMN: Logo + Company info ----------
      const logoW = 48, logoH = 48;

      // LOGO (top-left)
      if (base64Logo) {
        const logoX = leftColX;
        try {
          doc.addImage(base64Logo, undefined as any, logoX, headerTopY, logoW, logoH);
        } catch {
          doc.addImage(base64Logo, 'JPEG', logoX, headerTopY, logoW, logoH);
        }
      }

      // COMPANY INFO (left column, below logo)
      let companyY = headerTopY + logoH + 4;
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      safeText(config.companyInfo?.address || t('PDF.ADDRESS'), leftColX, companyY);
      companyY += 5;
      if (config.companyInfo?.vatNumber) { safeText(`Matricule fiscal: ${config.companyInfo.vatNumber}`, leftColX, companyY); companyY += 5; }
      if (config.companyInfo?.mobile)    { safeText(`Mobile: ${config.companyInfo.mobile}`, leftColX, companyY); companyY += 5; }
      if (config.companyInfo?.website)   { safeText(`w. ${config.companyInfo.website}`, leftColX, companyY); companyY += 5; }

      const companyBottom = companyY;

      // ---------- RIGHT COLUMN: Title ----------
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsL);
      safeText('Facture', pageWidth- (marginRight+20), headerTopY + 20, 'center');

      // Reference number below title
      doc.setFontSize(fsM);
      const refNumber = config.reference  ;
      safeText(refNumber, pageWidth- (marginRight+20), headerTopY + 15, 'center');

      // ---------- CLIENT BLOCK (below company info, left, bordered but not shaded) ----------
      let terms = '';
      const clientInfo = (config.generalInfo || [])
        .filter((g) => g && g.value != null && String(g.value).trim() !== '' && g.label !== 'PDF.OPERATION_TYPE' && g.label !== 'PDF.INVOICE_NUMBER' && g.label !== 'PDF.LOT_NUMBER' && g.label !== 'PDF.REFERENCE_DATE');

      (config.generalInfo || []).forEach((g) => {
        if (g.label === 'PDF.OPERATION_TYPE') {
          terms = String(g.value).trim();
        }
      });

      const clientBlockX = leftColX;
      const clientBlockY = companyBottom + 10;
      const clientBlockW = leftColW;
      const pad = 4;

      // measure height
      let clientBlockH = 0;
      if (clientInfo.length) {
        clientInfo.forEach((info) => {
          const full = `${t(info.label)}: ${info.value}`;
          const lines = doc.splitTextToSize(full, clientBlockW - pad * 2);
          clientBlockH += lines.length * 5;
        });
      }

      // border (no fill)
      doc.setDrawColor(0);
      doc.rect(clientBlockX, clientBlockY, clientBlockW, clientBlockH + pad * 2, 'D');

      // content (no title)
      doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);
      let y = clientBlockY + pad + 4;
      clientInfo.forEach((info) => {
        const full = `${t(info.label)}: ${info.value}`;
        const lines = doc.splitTextToSize(full, clientBlockW - pad * 2);
        lines.forEach((ln: string) => { safeText(ln, clientBlockX + pad, y); y += 5; });
      });

      const clientBottom = clientBlockY + clientBlockH + pad * 2;

      // ---------- RIGHT OF CLIENT: Date and Terms ----------
      const rightClientX = clientBlockX + clientBlockW + 10;
      let rightClientY = clientBlockY + pad + 4;
      safeText(`Date: ${config.date || new Date().toLocaleDateString()}`, rightClientX, rightClientY);
      rightClientY += 7;
      if (terms) {
        safeText(`Terms: `, rightClientX, rightClientY);
        doc.setTextColor(0, 0, 255); // blue
        safeText(terms, rightClientX + doc.getTextWidth(`Terms: `), rightClientY);
        doc.setTextColor(0); // black
        rightClientY += 7;
      }

      const rightClientBottom = rightClientY;

      // current Y for table
      let currentY = Math.max(clientBottom, rightClientBottom) + 12;

      // ---------- PRODUCTS TABLE (aligned grid) ----------
      const tableLeft = marginLeft;
      const cols = [
        { key: 'desc',  w: 100 },
        { key: 'unit',  w: 30  },
        { key: 'qty',   w: 30  },
        { key: 'total', w: 30  },
      ];

      // Precompute X positions to guarantee alignment
      const colX: number[] = [tableLeft];
      for (let i = 0; i < cols.length - 1; i++) colX.push(colX[i] + cols[i].w);

      const headerH = 10;
      const rowH    = 8;

      // Header background
      doc.setFillColor(225, 225, 225);
      cols.forEach((c, i) => doc.rect(colX[i], currentY, c.w, headerH, 'FD'));

      // Header labels (centered)
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsS);
      safeText(t('PDF.DESCRIPTION'), colX[0] + cols[0].w / 2, currentY + 6, 'center');
      safeText(t('Price'), colX[1] + cols[1].w / 2, currentY + 6, 'center');
      safeText(t('PDF.QUANTITY'), colX[2] + cols[2].w / 2, currentY + 6, 'center');
      safeText(t('PDF.TOTAL_AMOUNT'), colX[3] + cols[3].w / 2, currentY + 6, 'center');

      currentY += headerH;

      // Rows (config.fields)
       doc.setFont(this._fontName, 'normal');
      doc.setFontSize(fsS);

      const lines = (config.fields || []) as Array<{ label: string; value: string }>;

      let grandTotal = 0;

// ---- Group the 4 standard fields into ONE row if present ----
      const byLabel: Record<string, string> = {};
      lines.forEach((it) => (byLabel[it.label] = it.value));

      const hasStdFields =
        byLabel['PDF.DESCRIPTION'] != null ||
        byLabel['PDF.PRICE_UNIT'] != null ||
        byLabel['PDF.QUANTITY'] != null ||
        byLabel['PDF.TOTAL'] != null;

      if (hasStdFields) {
        const desc = terms || '';
        const unitPriceNum = this.parseNumberFrom(byLabel['PDF.PRICE_UNIT'] || '');
        const qtyNum       = this.parseNumberFrom(byLabel['PDF.QUANTITY'] || '');
        let totalNum       = this.parseNumberFrom(byLabel['PDF.TOTAL'] || '');

        if ((!totalNum || Number.isNaN(totalNum)) && isFinite(unitPriceNum) && isFinite(qtyNum)) {
          totalNum = unitPriceNum * qtyNum;
        }

        // draw row borders
        cols.forEach((c, i) => doc.rect(colX[i], currentY, c.w, rowH));

        // description (left-aligned)
        const descLines = doc.splitTextToSize(desc, cols[0].w - 4);
        safeText(descLines[0] || '', colX[0] + 2, currentY + 5);

        // numbers (centered)
        const unitStr = isFinite(unitPriceNum) && unitPriceNum !== 0 ? this.formatMoney(unitPriceNum) : '';
        const qtyStr  = isFinite(qtyNum)       && qtyNum       !== 0 ? this.formatQty(qtyNum) : '';
        const totStr  = isFinite(totalNum)     && totalNum     !== 0 ? this.formatMoney(totalNum) : '';

        safeText(unitStr, colX[1] + cols[1].w / 2, currentY + 5, 'center');
        safeText(qtyStr,  colX[2] + cols[2].w / 2, currentY + 5, 'center');
        safeText(totStr,  colX[3] + cols[3].w / 2, currentY + 5, 'center');

        grandTotal += isFinite(totalNum) ? totalNum : 0;
        currentY += rowH;

      } else {
        // ---- Fallback: treat each line as its own row (old behavior) ----
        lines.forEach((it) => {
          const { desc, unitPrice, qty, total } = this.parseInvoiceLine(it.label, it.value);

          cols.forEach((c, i) => doc.rect(colX[i], currentY, c.w, rowH));

          const descLines = doc.splitTextToSize(desc, cols[0].w - 4);
          safeText(descLines[0] || '', colX[0] + 2, currentY + 5);

          const unitStr = unitPrice != null ? this.formatMoney(unitPrice) : '';
          const qtyStr  = qty       != null ? this.formatQty(qty) : '';
          const rowTot  = total     != null ? total : (unitPrice != null && qty != null ? unitPrice * qty : null);
          const totStr  = rowTot    != null ? this.formatMoney(rowTot) : '';

          safeText(unitStr, colX[1] + cols[1].w / 2, currentY + 5, 'center');
          safeText(qtyStr,  colX[2] + cols[2].w / 2, currentY + 5, 'center');
          safeText(totStr,  colX[3] + cols[3].w / 2, currentY + 5, 'center');

          if (rowTot != null) grandTotal += rowTot;
          currentY += rowH;
        });
      }

      // ---------- GRAND TOTAL BOX (exactly the Total column) ----------
      const totalBoxX = colX[3];
      const totalBoxW = cols[3].w;
      const totalBoxY = currentY;

      doc.setLineWidth(0.5);
      doc.rect(totalBoxX, totalBoxY, totalBoxW, rowH);
      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsM);
      safeText(this.formatMoney(grandTotal), totalBoxX + totalBoxW / 2, totalBoxY + 5.2, 'center');

      currentY += rowH + 8;

      // ---------- BOTTOM INFO BLOCKS ----------
      // Left: Additional Info snapped to left column, Right: Bank Info snapped to right column
      const blockLeftX  = leftColX;
      const blockRightX = rightColX;
      const blockLeftW  = leftColW;
      const blockRightW = rightColW;

      // Additional Info (left)
      const add = config.additionalInfo || {};
      const addLines: string[] = [];
      if (add.grossWeight) addLines.push(`${t('PDF.GROSS_WEIGHT')}: ${add.grossWeight}`);
      if (add.netWeight)   addLines.push(`${t('PDF.NET_WEIGHT')}: ${add.netWeight}`);
      if (add.packages)    addLines.push(`${t('PDF.PACKAGES')}: ${add.packages}`);
      if (add.incoterm)    addLines.push(`${t('PDF.INCOTERM')}: ${add.incoterm}`);
      if (add.deliveryAddress) addLines.push(`${t('PDF.DELIVERY_ADDRESS')}: ${add.deliveryAddress}`);

      let leftBottomY = currentY;
      if (addLines.length) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.ADDITIONAL_INFO'), blockLeftX, leftBottomY);
        leftBottomY += 5;

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fsS);
        addLines.forEach((ln) => {
          const wrapped = doc.splitTextToSize(ln, blockLeftW);
          wrapped.forEach((wln: string) => {
            safeText(wln, blockLeftX, leftBottomY);
            leftBottomY += 5;
          });
        });
      }

      // Bank Info (right)
      const bank = config.bankInfo || {};
      let rightBottomY = currentY;
      if (bank.bankName || bank.iban || bank.swiftCode) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.BANK_INFO'), blockRightX, rightBottomY);
        rightBottomY += 5;

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fsS);
        if (bank.bankName) { safeText(`${t('PDF.BANK')}: ${bank.bankName}`, blockRightX, rightBottomY); rightBottomY += 5; }
        if (bank.iban)     { safeText(`IBAN: ${bank.iban}`, blockRightX, rightBottomY); rightBottomY += 5; }
        if (bank.swiftCode){ safeText(`SWIFT: ${bank.swiftCode}`, blockRightX, rightBottomY); rightBottomY += 5; }
      }

      currentY = Math.max(leftBottomY, rightBottomY) + 6;

      // Payment Terms (full width)
      const termsList = config.paymentTerms || [];
      if (termsList.length) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.PAYMENT_TERMS'), pageWidth / 2, currentY, 'center');
        currentY += 5;

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fsS);
        const fullW = pageWidth - marginLeft - marginRight;
        termsList.forEach((term) => {
          const wrapped = doc.splitTextToSize(`• ${term}`, fullW);
          wrapped.forEach((wln: string) => {
            safeText(wln, pageWidth / 2, currentY, 'center');
            currentY += 5;
          });
        });
        currentY += 2;
      }

      // Footer contact (full width)
      const fc = config.footerContact || {};
      if (fc.name || fc.phone) {
        doc.setFont(this._fontName, 'bold');
        doc.setFontSize(fsS);
        safeText(t('PDF.CONTACT'), pageWidth / 2, currentY, 'center');
        currentY += 5;

        doc.setFont(this._fontName, 'normal');
        doc.setFontSize(fsS);
        const parts = [
          fc.name ? `${t('PDF.NAME')}: ${fc.name}` : '',
          fc.phone ? `${t('PDF.PHONE')}: ${fc.phone}` : ''
        ].filter(Boolean);
        parts.forEach((p) => { safeText(p, pageWidth / 2, currentY, 'center'); currentY += 5; });
      }

      // OPEN
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Erreur lors de la génération de la facture :', err);
      alert('Impossible de générer la facture.');
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
      const logoWidth = 48;
      const logoHeight = 48;
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
  ): { desc: string; unitPrice: number | null; qty: number | null; total: number | null } {
    const desc = (label || '').trim();

    const nums = (value || '')
      .replace(/,/g, '.')
      .match(/-?\d+(\.\d+)?/g) || [];

    let unitPrice: number | null = null;
    let qty: number | null = null;
    let total: number | null = null;

    if (nums.length >= 3) {
      unitPrice = Number(nums[0]);
      qty       = Number(nums[1]);
      total     = Number(nums[2]);
    } else if (nums.length === 2) {
      unitPrice = Number(nums[0]);
      qty       = Number(nums[1]);
      total     = null; // compute later
    } else if (nums.length === 1) {
      if (/[x×*]/i.test(value)) {
        qty = Number(nums[0]); // looks like just "× qty"
      } else {
        total = Number(nums[0]); // only a total present
      }
    }

    return { desc, unitPrice, qty, total };
  }

  private formatMoney(n: number): string {
    if (!isFinite(n)) return '0';
    let s = n.toFixed(3).replace('.', ',');
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (s.endsWith(',000')) {
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
}

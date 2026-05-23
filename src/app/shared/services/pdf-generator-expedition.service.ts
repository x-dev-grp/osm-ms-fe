import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TranslateService } from '@ngx-translate/core';
import { PdfExpeditionConfig } from '../models/pdf-config.model';
import { DatePipe } from '@angular/common';
import { findOfInfoForGenealogyKey } from '../utils/traceability-snapshot.util';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorExpeditionService {
  logoPreview: string | null = null;
  private readonly _fontName = 'helvetica';
  private datePipe = new DatePipe('en-US');

  constructor(
    private translationService: TranslateService
  ) {}

  async generatePdf(config: PdfExpeditionConfig): Promise<void> {
    try {
      const base64Logo = await this.pickLogo(config.companyInfo?.logoUrl);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const marginLeft = 15;
      const marginRight = 15;
      const contentWidth = pageWidth - marginLeft - marginRight;
      let currentY = 15;

      const t = (key: string) => this.translationService.instant(key);
      const fsS = 9, fsM = 10, fsL = 12, fsXL = 16;

      // --- 1. HEADER (Logo + Title) ---
      if (base64Logo) {
        doc.addImage(base64Logo, 'JPEG', marginLeft, currentY, 35, 20);
      }

      doc.setFont(this._fontName, 'bold');
      doc.setFontSize(fsXL);
      doc.text(t(config.title).toUpperCase(), pageWidth - marginRight, currentY + 10, { align: 'right' });
      
      doc.setFontSize(fsM);
      doc.text(`${t('PDF.REFERENCE')}: ${config.reference}`, pageWidth - marginRight, currentY + 18, { align: 'right' });
      doc.text(`${t('PDF.DATE')}: ${config.date || ''}`, pageWidth - marginRight, currentY + 24, { align: 'right' });

      currentY += 35;

      // --- 2. DESTINATION & LOGISTICS BLOCKS ---
      const colWidth = contentWidth / 2 - 5;
      
      // Client / Destination (Left)
      doc.setFontSize(fsL);
      doc.setFont(this._fontName, 'bold');
      doc.text(t('PDF.CLIENT_DESTINATION'), marginLeft, currentY);
      
      doc.setFontSize(fsM);
      doc.setFont(this._fontName, 'normal');
      let destY = currentY + 7;
      destY = this.drawWrapped(config.clientInfo?.name || '', marginLeft, destY, colWidth, doc);
      destY = this.drawWrapped(config.logistics?.destination || config.clientInfo?.address || '', marginLeft, destY, colWidth, doc);
      if (config.clientInfo?.phone) {
        destY = this.drawWrapped(`${t('PDF.PHONE')}: ${config.clientInfo.phone}`, marginLeft, destY, colWidth, doc);
      }

      // Logistics Info (Right)
      const rightColX = marginLeft + colWidth + 10;
      doc.setFontSize(fsL);
      doc.setFont(this._fontName, 'bold');
      doc.text(t('PDF.LOGISTICS_INFO'), rightColX, currentY);
      
      doc.setFontSize(fsM);
      doc.setFont(this._fontName, 'normal');
      let logY = currentY + 7;
      if (config.logistics?.carrier) logY = this.drawWrapped(`${t('PDF.CARRIER')}: ${config.logistics.carrier}`, rightColX, logY, colWidth, doc);
      if (config.logistics?.driver) logY = this.drawWrapped(`${t('PDF.DRIVER')}: ${config.logistics.driver}`, rightColX, logY, colWidth, doc);
      if (config.logistics?.truck) logY = this.drawWrapped(`${t('PDF.TRUCK')}: ${config.logistics.truck}`, rightColX, logY, colWidth, doc);
      if (config.logistics?.incoterm) logY = this.drawWrapped(`${t('PDF.INCOTERM')}: ${config.logistics.incoterm}`, rightColX, logY, colWidth, doc);

      currentY = Math.max(destY, logY) + 15;

      // --- 3. ARTICLES TABLE ---
      doc.setFontSize(fsL);
      doc.setFont(this._fontName, 'bold');
      doc.text(t('PDF.SHIPMENT_CONTENT'), marginLeft, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [[t('PDF.OF'), t('PDF.ARTICLE'), t('PDF.QUANTITY'), t('PDF.LOT_NUMBER')]],
        body: config.lines.map(l => [l.ofCode, l.articleName, `${l.quantity} ${l.unit}`, l.lotNumber]),
        margin: { left: marginLeft, right: marginRight },
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { font: this._fontName, fontSize: fsS }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;

      // --- 4. TRACEABILITY GENEALOGY (The Highlight) ---
      if (config.traceability?.eventChains?.length) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(fsL);
        doc.setFont(this._fontName, 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(t('PDF.TRACEABILITY_GENEALOGY'), marginLeft, currentY);
        currentY += 10;

        const snapshot = config.traceability;
        for (const chain of snapshot.eventChains as Array<{ ofCode?: string; events?: Array<{ sequence?: number; title?: string; type?: string; timestamp?: string; phase?: string }> }>) {
          doc.setFontSize(fsM);
          doc.setFont(this._fontName, 'bold');
          doc.setTextColor(59, 130, 246);
          doc.text(`OF: ${chain.ofCode || '—'}`, marginLeft, currentY);
          currentY += 8;
          const events = [...(chain.events || [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
          currentY = this.drawEventChain(doc, events, marginLeft + 5, currentY);
          currentY += 12;
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }
        }
        doc.setFontSize(fsS);
        doc.setTextColor(150, 150, 150);
        doc.setFont(this._fontName, 'italic');
        doc.text(`${t('PDF.SNAPSHOT_CAPTURED_AT')}: ${this.datePipe.transform(snapshot.capturedAt, 'dd/MM/yyyy HH:mm')}`, marginLeft, currentY);
      } else if (config.traceability && config.traceability.oilGenealogy) {
        // Check if we need a new page
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(fsL);
        doc.setFont(this._fontName, 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(t('PDF.TRACEABILITY_GENEALOGY'), marginLeft, currentY);
        currentY += 10;

        const snapshot = config.traceability;
        const genealogyMap = snapshot.oilGenealogy;
        const ofDetails = snapshot.ofDetails;

        for (const anchorKey in genealogyMap) {
          const genea = genealogyMap[anchorKey];
          const ofInfo = findOfInfoForGenealogyKey(ofDetails, anchorKey);

          if (!genea) continue;

          // Header for this lot
          doc.setFontSize(fsM);
          doc.setFont(this._fontName, 'bold');
          doc.setTextColor(59, 130, 246); // Blue color
          const lotLabel = ofInfo?.['traceabilityLotId'] || ofInfo?.['lotVracId'] || anchorKey;
          doc.text(`OF: ${ofInfo?.['code'] || '—'} | Lot: ${lotLabel}`, marginLeft, currentY);
          currentY += 8;

          // Draw Timeline
          currentY = this.drawTimeline(doc, genea, marginLeft + 5, currentY);
          currentY += 15;

          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }
        }
        
        doc.setFontSize(fsS);
        doc.setTextColor(150, 150, 150);
        doc.setFont(this._fontName, 'italic');
        doc.text(`${t('PDF.SNAPSHOT_CAPTURED_AT')}: ${this.datePipe.transform(snapshot.capturedAt, 'dd/MM/yyyy HH:mm')}`, marginLeft, currentY);
      }

      // --- FOOTER ---
      const footerY = 285;
      doc.setFontSize(fsS);
      doc.setTextColor(100, 100, 100);
      doc.setFont(this._fontName, 'normal');
      const footerText = config.companyInfo?.address || '';
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });

      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Error generating Expedition PDF', err);
    }
  }

  private drawEventChain(
    doc: jsPDF,
    events: Array<{ title?: string; type?: string; timestamp?: string; phase?: string }>,
    x: number,
    y: number
  ): number {
    let currentY = y;
    const markerX = x + 2;
    const contentX = x + 10;
    const circleRadius = 1.5;
    const startY = y;

    for (const evt of events) {
      this.drawMarker(doc, markerX, currentY, '#64748b', circleRadius);
      doc.setFontSize(8);
      doc.setFont(this._fontName, 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(`${evt.phase || ''} · ${evt.type || ''}`, contentX, currentY);
      currentY += 5;
      doc.setFontSize(9);
      doc.setFont(this._fontName, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(evt.title || '—', contentX, currentY);
      currentY += 4;
      if (evt.timestamp) {
        doc.setFontSize(8);
        doc.text(this.datePipe.transform(evt.timestamp, 'dd/MM/yyyy HH:mm') || '—', contentX, currentY);
        currentY += 4;
      }
      currentY += 6;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(markerX, startY + circleRadius, markerX, currentY - circleRadius);
    return currentY;
  }

  private drawTimeline(doc: jsPDF, genea: any, x: number, y: number): number {
    let currentY = y;
    const markerX = x + 2;
    const contentX = x + 10;
    const lineHeight = 6;
    const circleRadius = 1.5;

    // 1. Root Sources
    const sources = genea.rootSources || (genea.rootSource ? [genea.rootSource] : []);
    sources.forEach((root: any, rIdx: number) => {
      this.drawMarker(doc, markerX, currentY, '#10b981', circleRadius); // Green
      doc.setFontSize(8);
      doc.setFont(this._fontName, 'bold');
      doc.setTextColor(100, 100, 100);
      const originLabel = sources.length > 1 ? `ORIGINE ${rIdx + 1}` : 'ORIGINE';
      doc.text(`${originLabel} (${root.type})`, contentX, currentY);
      currentY += 5;
      
      doc.setFontSize(9);
      doc.setFont(this._fontName, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`${root.supplierName}`, contentX, currentY);
      currentY += 4;
      doc.setFontSize(8);
      let rootSubText = `Lot: ${root.lotNumber} | Date: ${this.datePipe.transform(root.date, 'dd/MM/yyyy') || '—'}`;
      if (root.extra?.storageUnitName) {
        rootSubText += ` | Cuve: ${root.extra.storageUnitName}`;
      }
      doc.text(rootSubText, contentX, currentY);
      
      if (root.extra) {
          currentY += 4;
          const extra = root.extra;
          let extraText = '';
          if (extra.rendement) extraText += `Rendement: ${extra.rendement}%  `;
          if (extra.variety) extraText += `Variété: ${extra.variety}`;
          if (extraText) {
            doc.setFont(this._fontName, 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text(extraText, contentX, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont(this._fontName, 'normal');
          } else {
            currentY -= 4; // Reset if no extra text
          }
      }
      currentY += 10;
    });

    // 2. Filtrations
    if (genea.filtrations && genea.filtrations.length > 0) {
      genea.filtrations.forEach((filt: any) => {
        this.drawMarker(doc, markerX, currentY, '#3b82f6', circleRadius); // Blue
        doc.setFontSize(8);
        doc.setFont(this._fontName, 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(`FILTRATION`, contentX, currentY);
        currentY += 5;
        
        doc.setFontSize(9);
        doc.setFont(this._fontName, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Lot Cible: ${filt.targetLotNumber}`, contentX, currentY);
        currentY += 4;
        doc.setFontSize(8);
        let filtSubText = `Volume: ${filt.volumeFiltered} L | ${this.datePipe.transform(filt.timestamp, 'dd/MM/yyyy HH:mm')}`;
        if (filt.sourceStorageUnitName) {
            filtSubText += ` | Source: ${filt.sourceStorageUnitName}`;
        }
        doc.text(filtSubText, contentX, currentY);
        
        currentY += 10;
      });
    }

    // Vertical line connecting all markers
    doc.setDrawColor(200, 200, 200);
    doc.line(markerX, y + circleRadius, markerX, currentY - 10 - circleRadius);

    // 3. Final Storage
    this.drawMarker(doc, markerX, currentY, '#6366f1', circleRadius); // Indigo
    doc.setFontSize(8);
    doc.setFont(this._fontName, 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`UNITÉ DE STOCKAGE FINALE`, contentX, currentY);
    currentY += 5;
    
    doc.setFontSize(9);
    doc.setFont(this._fontName, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${genea.storageUnitName}`, contentX, currentY);
    currentY += 4;
    doc.setFontSize(8);
    doc.text(`Lot Final: ${genea.lotNumber}`, contentX, currentY);

    return currentY + 5;
  }

  private drawMarker(doc: jsPDF, x: number, y: number, color: string, radius: number) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.circle(x, y - 1, radius, 'F');
  }

  private drawWrapped(text: string, x: number, y: number, width: number, doc: jsPDF): number {
    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line: string, i: number) => {
      doc.text(line, x, y + i * 5);
    });
    return y + lines.length * 5;
  }

  private async pickLogo(url?: string): Promise<string | null> {
    const candidate = url || this.logoPreview || 'assets/logo.jpg';
    try {
      const res = await fetch(candidate);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}

import {Injectable} from '@angular/core';
// src/app/services/pdf-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import jsPDF from 'jspdf';
import {TranslateService} from '@ngx-translate/core';
import {CompanyProfileService} from './company-profile.service';
import {CompanyProfile} from '../models/CompanyProfile';
import {PdfConfig} from "../models/pdf-config.model";


import { TranslateService }      from '@ngx-translate/core';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfile } from '../models/CompanyProfile';

import { UnifiedDelivery } from '../models/UnifiedDelivery';
import { Expense }         from '../../finance/models/expense.model';

const CENTER      = 'center';
const FONT_NORMAL = 'normal';
const FONT_BOLD   = 'bold';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  logoPreview: string | null = null;
  private profile?: CompanyProfile;

  constructor(
    private translationService: TranslateService,
    private companyProfileService: CompanyProfileService,
    private http: HttpClient
  ) {
    this.loadProfile();
  }

  /** Load company profile (and logo) */
  private loadProfile(): void {
    this.companyProfileService.getProfile().subscribe(
      res => {
        if (res?.success && res.data.length) {
          this.profile     = res.data[0];
          if (this.profile.logoData && this.profile.logoContentType) {
            this.logoPreview = `data:${this.profile.logoContentType};base64,${this.profile.logoData}`;
          }
        }
      },
      err => console.error('Error loading profile', err)
    );
  }

  /** Convert an <img> URL to base64 for jsPDF */
  private getBase64ImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = reject;
    });
  }

  /** Fetch a .ttf over HTTP and return raw base64 string */
  private loadFont(path: string): Promise<string> {
    return this.http
      .get(path, { responseType: 'arraybuffer' })
      .toPromise()
      .then(buffer => {
        const binary = Array.from(new Uint8Array(buffer!))
          .map(b => String.fromCharCode(b))
          .join('');
        return btoa(binary);
      });
  }

  /** Register Rubik + RubikArabic fonts into jsPDF */
  private registerFonts(doc: jsPDF): Promise<void> {
    const fonts = [
      {
        path: 'assets/fonts/Rubik/static/Rubik-Regular.ttf',
        fileName: 'Rubik-Regular.ttf',
        fontName: 'Rubik',
        style: FONT_NORMAL
      },
      {
        path: 'assets/fonts/Rubik/static/Rubik-Bold.ttf',
        fileName: 'Rubik-Bold.ttf',
        fontName: 'Rubik',
        style: FONT_BOLD
      },
      {
        path: 'assets/fonts/Rubik/static/Rubik-Italic.ttf',
        fileName: 'Rubik-Italic.ttf',
        fontName: 'Rubik',
        style: 'italic'
      },
    ];

    return Promise.all(
      fonts.map(f =>
        this.loadFont(f.path).then(b64 => {
          doc.addFileToVFS(f.fileName, b64);
          doc.addFont(f.fileName, f.fontName, f.style);
        })
      )
    ).then(() => {});
  }

  /**
   * Core PDF builder—logo, header, table, footer.
   * Waits for fonts to register before drawing.
   */
  generatePdfDocument(config: {
    title: string;
    reference: string;
    date?: string;
    fields?: { label: string; value: string }[];
    generalInfo?: { label: string; value: string }[];
    footerInfo?: { label: string; placeholder?: string }[];
    fileName?: string;
  }): void {
    const logo$ = this.logoPreview
      ? Promise.resolve(this.logoPreview)
      : this.getBase64ImageFromUrl('assets/logo.jpg');

    logo$.then(logoBase64 => {
      const doc = new jsPDF();
      this.registerFonts(doc).then(() => {
        let y = 10;
        const ml = 10;
        const lw = 30;
        const lh = 20;
        const hh = 20;
        const pw = 210;
        const dateStr = config.date || new Date().toLocaleDateString();

        // — Logo —
        doc.rect(ml, y, lw, lh);
        doc.addImage(logoBase64, 'JPEG', ml+1, y+1, lw-2, lh-2);

        // — Center header (Rubik Bold / Italic) —
        const cx = ml + lw;
        doc.rect(cx, y, 100, hh);
        doc.setFont('Rubik', FONT_BOLD);
        doc.setFontSize(12);
        doc.text(
          this.translationService.instant('PDF.FORM'),
          cx + 50, y + 7,
          { align: CENTER }
        );
        doc.setFont('Rubik', 'italic');
        doc.setFontSize(10);
        doc.text(
          this.translationService.instant(config.title),
          cx + 50, y + 14,
          { align: CENTER }
        );

        // — Right info (Rubik Normal) —
        const rx = cx + 100;
        const rh = 5;
        const rw = pw - rx - ml;
        const rows = [
          ['PDF.REFERENCE', config.reference],
          ['PDF.REVISION',  '00'],
          ['PDF.DATE',      dateStr],
          ['PDF.PAGE',      '1/1']
        ].map(([k, v]) => ({
          label: this.translationService.instant(k),
          value: v
        }));

        doc.setFont('Rubik', FONT_NORMAL);
        doc.setFontSize(9);
        rows.forEach((r, i) => {
          const yy = y + i * rh;
          doc.rect(rx, yy, rw, rh);
          doc.text(`${r.label}: ${r.value}`, rx + 2, yy + 4);
        });

        y += hh + 10;

        // — Number placeholder —
        doc.setFont('Rubik', FONT_BOLD);
        doc.setFontSize(10);
        doc.text(
          this.translationService.instant('PDF.NUMBER_PLACEHOLDER'),
          pw / 2, y,
          { align: CENTER }
        );
        y += 15;

        // — General Info —
        if (config.generalInfo?.length) {
          doc.setFont('Rubik', FONT_NORMAL);
          doc.setFontSize(12);
          config.generalInfo.forEach(i =>
            doc.text(
              `${this.translationService.instant(i.label)}: ${i.value}`,
              ml, y += 10
            )
          );
          y += 5;
        }

        // — Table (fields) —
        if (config.fields?.length) {
          const tl = ml;
          const tw = 190;
          const cc = config.fields.length;
          const cw = tw / cc;
          const fs = 9;

          // Header row
          const lbls = config.fields.map(f =>
            doc.splitTextToSize(
              this.translationService.instant(f.label),
              cw - 4
            )
          );
          const hH = Math.max(...lbls.map(l => l.length)) * 5 + 2;

          doc.setFont('Rubik', FONT_BOLD).setFontSize(fs);
          lbls.forEach((lines, i) => {
            const x = tl + i * cw;
            doc.setFillColor(200,200,200).rect(x, y, cw, hH, 'FD');
            lines.forEach((l: string, idx: number) =>
              doc.text(l, x+2, y + 6 + idx*5)
            );
          });

          // Data row
          y += hH;
          const vals = config.fields.map(f =>
            doc.splitTextToSize(f.value||'', cw - 4)
          );
          const dH = Math.max(...vals.map(l => l.length)) * 5 + 2;

          doc.setFont('Rubik', FONT_NORMAL).setFontSize(fs);
          vals.forEach((lines, i) => {
            const x = tl + i * cw;
            doc.rect(x, y, cw, dH);
            lines.forEach((l: string, idx: number) =>
              doc.text(l, x+2, y + 6 + idx*5)
            );
          });

          y += dH + 15;
        }

        // — Footer —
        if (config.footerInfo?.length) {
          const sepY = 270;
          doc.setDrawColor(0).line(10, sepY, 200, sepY);

          const fy    = 280;
          const mr    = 10;
          const usable = pw - ml - mr;
          const count  = Math.min(config.footerInfo.length, 4);
          const sp     = usable / count;

          doc.setFont('Rubik', FONT_NORMAL).setFontSize(10);
          config.footerInfo.slice(0,4).forEach((f,i) => {
            const x = ml + i * sp;
            doc.text(
              `${this.translationService.instant(f.label)}:`,
              x, fy
            );
            if (f.placeholder) {
              doc.setFontSize(8).setTextColor(150);
              doc.text(f.placeholder, x+40, fy);
              doc.setTextColor(0).setFontSize(10);
            }
          });
        }

        // — Open PDF —
        window.open(doc.output('bloburl'), '_blank');
      });
    }).catch(err => {
      console.error('Error generating PDF', err);
    });
  }

  // pdf-generator.service.ts

  generateReceptionPdf(config: PdfConfig): void {
    this.generatePdfDocument(config);
  }

  // generateReceptionPdf(delivery: UnifiedDelivery, type: 'OIL' | 'OLIVE'): void {
  //   const isHuile = type === 'OIL';
  //
  //   const commonData = {
  //     reference: delivery.lotNumber || '',
  //     date: '',
  //     generalInfo: [
  //       { label: 'PDF.TYPE', value: delivery.deliveryType || '' },
  //       {
  //         label: 'PDF.SUPPLIER',
  //         value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
  //       },
  //       { label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || '' },
  //       {
  //         label: 'PDF.ADDRESS',
  //         value: delivery.supplier?.supplierInfo?.address || ''
  //       }
  //     ],
  //     footerInfo: [
  //       { label: 'PDF.SIGNATURE_AGENT', placeholder: '' },
  //       {
  //         label: 'PDF.SIGNATURE_RESPONSIBLE',
  //         placeholder: ''
  //       }
  //     ]
  //   };
  //
  //   const fields = isHuile
  //     ? [
  //         { label: 'PDF.LOT', value: delivery.lotNumber || '' },
  //         {
  //           label: 'PDF.LOT_GLOBAL',
  //           value: delivery.globalLotNumber || ''
  //         },
  //         { label: 'PDF.GROSS_WEIGHT', value: `${delivery.poidsBrute || ''} kg` },
  //         {
  //           label: 'PDF.OIL_QUANTITY',
  //           value: `${delivery.oilQuantity || ''} kg`
  //         },
  //         { label: 'PDF.OIL_VARIETY', value: delivery.oilVariety?.name || '' },
  //         {
  //           label: 'PDF.OIL_TYPE',
  //           value: delivery.oilType?.name || ''
  //         },
  //         { label: 'PDF.REGION', value: delivery.region?.name || '' }
  //       ]
  //     : [
  //         {
  //           label: 'PDF.LOT',
  //           value: delivery.lotNumber || ''
  //         },
  //         { label: 'PDF.LOT_GLOBAL', value: delivery.globalLotNumber || '' },
  //         {
  //           label: 'PDF.GROSS_WEIGHT',
  //           value: `${delivery.poidsBrute || ''} kg`
  //         },
  //         { label: 'PDF.OLIVE_QUANTITY', value: `${delivery.oilQuantity || ''} kg` },
  //         {
  //           label: 'PDF.OLIVE_VARIETY',
  //           value: delivery.oliveVariety?.name || ''
  //         },
  //         { label: 'PDF.OLIVE_TYPE', value: delivery.oliveType?.name || '' },
  //         {
  //           label: 'PDF.REGION',
  //           value: delivery.region?.name || ''
  //         }
  //       ];
  //
  //   const title = isHuile ? 'PDF.RECEPTION_OIL' : 'PDF.RECEPTION_OLIVE';
  //   const fileName = isHuile
  //     ? `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
  //     : `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`;
  //
  //   this.generatePdfDocument({
  //     ...commonData,
  //     title,
  //     fields,
  //     fileName
  //   });
  // }

  /**
   * Generate a production receipt
   */
  generateProductionPDF(data: any): void {
    const dl = new Date(data.deliveryDate).toLocaleDateString();
    const tr = new Date(data.trtDate    ).toLocaleDateString();
    const netKg = `${data.poidsNet} kg`;
    const oilKg = `${data.oilQuantity||0} kg`;
    const yieldPct = `${(data.rendement||0).toFixed(2)} %`;
    const priceKg = '0.15 DNT/kg';
    const total   = `${(data.poidsNet*0.15).toFixed(2)} DNT`;

    const genInfo = [
      { label: 'PDF.LOT_NUMBER',    value: data.lotNumber        || '-' },
      { label: 'PDF.RECEPTION_NUMBER',value: data.deliveryNumber || '-' },
      { label: 'PDF.DELIVERY_DATE',  value: dl },
      { label: 'PDF.OLIVE_NET_WEIGHT',value: netKg },
      { label: 'PDF.SUPPLIER',       value: data.supplier?.supplierInfo?.name || '-' },
      { label: 'PDF.REGION',         value: data.region?.name    || '-' },
      { label: 'PDF.OLIVE_VARIETY',  value: data.oliveVariety?.name|| '-' },
      { label: 'PDF.OLIVE_TYPE',     value: data.oliveType?.name  || '-' }
    ];

    const fields = [
      { label: 'PDF.OIL_QUANTITY',         value: oilKg    },
      { label: 'PDF.YIELD',                value: yieldPct },
      { label: 'PDF.CRUSHING_PRICE_PER_KG',value: priceKg  },
      { label: 'PDF.CRUSHING_TOTAL_PRICE', value: total    },
      { label: 'PDF.CRUSHING_DATE',        value: tr       }
    ];

    this.generatePdfDocument({
      title:     'PDF.PRODUCTION_RECEIPT',
      reference: data.deliveryNumber || 'N/A',
      date:      new Date().toLocaleDateString(),
      generalInfo: genInfo,
      fields,
      footerInfo: [
        { label: 'PDF.QUALITY_MANAGER'  },
        { label: 'PDF.PRODUCTION_MANAGER'},
        { label: 'PDF.SIGNATURE'        },
        { label: 'PDF.DATE'             }
      ],
      fileName: `BonProduction_${data.lotNumber||'LOT'}.pdf`
    });
  }

  /**
   * Generate an expense bill PDF
   */
  generateExpensePdf(expense: Expense): void {
    this.generatePdfDocument({
      title:     'PDF.EXPENSE_BILL',
      reference: expense.invoiceRef || '',
      date:      new Date().toLocaleDateString(),
      generalInfo: [
        { label: 'PDF.EXPENSE_VENDOR',        value: expense.vendor        || '-' },
        { label: 'PDF.EXPENSE_CATEGORY',      value: expense.category      || '-' },
        { label: 'PDF.EXPENSE_PURCHASE_NATURE',value: expense.purchaseNature|| '-' },
        { label: 'PDF.EXPENSE_OBJECT',        value: expense.object        || '-' }
      ],
      fields: [
        { label: 'PDF.EXPENSE_AMOUNT',         value: `${expense.amount} TND` },
        { label: 'PDF.EXPENSE_PAYMENT_METHOD', value: expense.paymentMethod|| '-' },
        { label: 'PDF.EXPENSE_STATUS',         value: expense.status       || '-' },
        { label: 'PDF.EXPENSE_RECEIPT_NUMBER', value: expense.receiptNumber|| '-' },
        { label: 'PDF.EXPENSE_NOTES',          value: expense.notes        || '-' },
        { label: 'PDF.EXPENSE_APPROVED',       value: expense.approved ? 'Oui' : 'Non' },
        { label: 'PDF.EXPENSE_APPROVAL_DATE',  value: expense.approvalDate
            ? (expense.approvalDate as any).toLocaleDateString?.() || expense.approvalDate
            : '-'
        },
        { label: 'PDF.EXPENSE_CREATED_BY',     value: expense.createdBy    || '-' }
      ],
      footerInfo: [
        { label: 'PDF.EXPENSE_SIGNATURE_AGENT',     placeholder: '' },
        { label: 'PDF.EXPENSE_SIGNATURE_RESPONSIBLE',placeholder: '' }
      ],
      fileName: `Depense_${expense.invoiceRef||'N/A'}.pdf`
    });
  }
}

import { Injectable } from '@angular/core';
import { CompanyProfile } from '../models/CompanyProfile';
import { PdfFactureConfig, PdfPaymentNoteConfig } from '../models/pdf-config.model';
import { InvoiceSource } from '../../reception/components/suppliers/supplier-details/supplier-details.component';
import { TranslateService } from '@ngx-translate/core';
import { UnifiedDelivery } from '../models/UnifiedDelivery';

// Keep config mode separate from "source"
export type PdfConfigMode = 'auto' | 'invoice' | 'paymentNote';

// ---------- Helpers ----------
const fmtMoney = (n: number | undefined | null) => `${Number(n ?? 0).toFixed(2)} TND`;

const fmtDate = (d?: string | number | Date | null) =>
  new Date(d ?? Date.now()).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

function buildCompanyInfo(company: CompanyProfile) {
  return {
    companyName: company?.legalName ?? '',
    address: `${company?.addressLine1 ?? ''}${company?.city ? ', ' + company.city : ''} ${company?.postalCode ?? ''}`.trim(),
    vatNumber: company?.taxId ?? '',
    mobile: company?.phone ?? '',
    website: company?.website ?? '',
    logoUrl: company.logoData ? `data:${company.logoData}` : undefined
  };
}

function supplierNameLike(data: any): string {
  const s = (data as any)?.supplier?.supplierInfo;
  const first = s?.name ?? '';
  const last = s?.lastname ?? '';
  return `${first} ${last}`.trim();
}

function supplierPhoneLike(data: any): string {
  return (data as any)?.supplier?.supplierInfo?.phone ?? '';
}

function supplierAddressLike(data: any): string {
  return (data as any)?.supplier?.supplierInfo?.address ?? '';
}

@Injectable({ providedIn: 'root' })
export class PdfConfigFactoryService {
  private company: CompanyProfile | null = null;

  constructor(private translateService: TranslateService) {}

  /**
   * Build a PDF config (Facture or Payment Note).
   * @param data      UnifiedDelivery | OilSale | WasteSale
   * @param source    Source type to influence titles/labels (e.g.,  nvoiceSource.DELIVERY_inv | 'OIL_SALE' | 'WASTE_SALE' ... per your app)
   * @param configMode 'auto' (unpaid>0 → payment note), or force 'invoice' / 'paymentNote'
   */
  build(data: any, source?: InvoiceSource, configMode: PdfConfigMode = 'auto'): PdfFactureConfig | PdfPaymentNoteConfig {
    // Load company profile from localStorage (safe parse)
    try {
      const raw = localStorage.getItem('company_profile');
      this.company = raw ? (JSON.parse(raw) as CompanyProfile) : null;
    } catch {
      this.company = null;
    }

    const unpaid = this.getUnpaidAmount(data);
    const isPaymentNote = configMode === 'paymentNote' || (configMode === 'auto' && unpaid > 0);

    const nowStr = fmtDate();
    const companyInfo = buildCompanyInfo(this.company!);

    // Shared general info (allowed on both configs)
    const generalInfo = [
      { label: 'PDF.CLIENT', value: supplierNameLike(data) },
      {
        label: 'PDF.PHONE',
        value: supplierPhoneLike(data)
      },
      { label: 'PDF.ADDRESS', value: supplierAddressLike(data) },
      {
        label: 'PDF.OPERATION_TYPE',
        value: this.getOperationType(data, source)
      },
      { label: 'PDF.INVOICE_NUMBER', value: this.getInvoiceNumber(data) || '—' },
      {
        label: 'PDF.LOT_NUMBER',
        value: (data as UnifiedDelivery).lotNumber || '—'
      },
      { label: 'PDF.REFERENCE_DATE', value: this.getReferenceDate(data) }
    ];

    if (isPaymentNote) {
      // ---------- Payment Note ----------
      const total = this.getTotalAmount(data);
      const paid = this.getPaidAmount(data);

      const cfg: PdfPaymentNoteConfig = {
        title:'PDF.NOTE_DE_PAIEMENT',
        reference: this.getReferencePrefix(data, source, true),
        date: nowStr,

        companyInfo,
        generalInfo,

        paymentDetails: [
          {
            paymentType: (data as any)?.paymentMethod ?? 'CASH',
            totalAmount: fmtMoney(total),
            paidAmount: fmtMoney(paid),
            paymentDate: fmtDate((data as any)?.paymentDate),
            remainingAmount: fmtMoney(unpaid)
          }
        ],

        total: fmtMoney(total),
        paid: fmtMoney(paid),
        unpaid: fmtMoney(unpaid)
      };

      return cfg;
    }

    // ---------- Facture ----------
    const typeFields = this.getTypeFieldsForInvoice(data, source);
    const facture: PdfFactureConfig = {
      title: this.getInvoiceTitle(data, source),
      reference: this.getReferencePrefix(data, source, false),
      date: nowStr,

      generalInfo,
      fields: typeFields.fields,

      companyInfo,
      fileName: typeFields.fileName
    };

    return facture;
  }

  // =========================
  // Internals
  // =========================

  /**
   * Title for INVOICE (uses source first, then falls back to type guards)
   */
  private getInvoiceTitle(data: any, source?: InvoiceSource): string {
    switch (source) {
      case InvoiceSource.DELIVERY_inv:
        return `FACTURE ${data.lotNumber ?? '—'}`;
      case InvoiceSource.OIL_SALE_inv:
        return 'PDF.FACTURE';
      case InvoiceSource.WASTE_SALE_inv:
        return 'PDF.FACTURE_VENTE_DECHET';
      // Add other app-specific sources here if you have them
    }
    // Fallback to inferred type

    return 'PDF.FACTURE';
  }

  /**
   * Title for PAYMENT NOTE (lets you customize by source as well)
   */
  private getPaymentNoteTitle(data: any, source?: InvoiceSource): string {
    return '';
  }

  private getReferencePrefix(data: any, source: InvoiceSource | undefined, isPaymentNote: boolean): string {
    const inv = this.getInvoiceNumber(data) || this.getId(data) || 'XXXX';

    // Prefer explicit source mapping
    switch (source) {
      case InvoiceSource.DELIVERY_inv:
        return isPaymentNote
          ? `PAY-${inv}`
          : `${InvoiceSource.DELIVERY_inv ? data.lotNumber || 'LOT' : 'LOT'} ${this.translateService.instant('OPERATION_TYPE.' + data.operationType) || ''}`.trim();
      case InvoiceSource.OIL_SALE_inv:
        return isPaymentNote ? `PAY-VENTE-${inv}` : `VENTE-HUILE-${inv}`;
      case InvoiceSource.WASTE_SALE_inv:
        return isPaymentNote ? `PAY-VENTE-DECHET-${inv}` : `VENTE-DECHET-${inv}`;
    }

    // Fallback to inferred type

    return inv;
  }

  private getOperationType(data: any, source?: InvoiceSource): any {
    if (source === InvoiceSource.DELIVERY_inv) {
      return this.translateService.instant('OPERATION_TYPE.' + data.operationType);
    }
    if (source === InvoiceSource.OIL_SALE_inv) return (data as any)?.type || 'VENTE HUILE';
    if (source === InvoiceSource.WASTE_SALE_inv) return (data as any)?.type || 'VENTE DECHET';
  }

  private getReferenceDate(data: any, source?: InvoiceSource): string {
    if (source === InvoiceSource.DELIVERY_inv) return fmtDate(data.deliveryDate);
    if (source === InvoiceSource.OIL_SALE_inv) return fmtDate((data as any)?.saleDate);
    if (source === InvoiceSource.WASTE_SALE_inv) return fmtDate((data as any)?.saleDate);
    return fmtDate();
  }

  private getInvoiceNumber(data: any, source?: InvoiceSource): string {
    if (source === InvoiceSource.DELIVERY_inv) {
      return (data as any).deliveryNumber ?? '';
    }
    if (source === InvoiceSource.OIL_SALE_inv) {
      return (data as any).invoiceNumber ?? '';
    }
    if (source === InvoiceSource.WASTE_SALE_inv) {
      return (data as any).invoiceNumber ?? '';
    }
    return '';
  }

  private getId(data: any): string {
    return (data as any)?.id ?? '';
  }

  private getTotalAmount(data: any, source?: InvoiceSource): number {
    if (source === InvoiceSource.DELIVERY_inv) {
      return Number((data as any)?.price ?? 0);
    }
    if (source === InvoiceSource.OIL_SALE_inv) {
      return Number((data as any)?.totalAmount ?? 0);
    }
    if (source === InvoiceSource.WASTE_SALE_inv) {
      return Number((data as any)?.totalPrice ?? 0);
    }
    return 0;
  }

  private getPaidAmount(data: any): number {
    return Number((data as any)?.paidAmount ?? 0);
  }

  private getUnpaidAmount(data: any): number {
    const explicit = (data as any)?.unpaidAmount;
    if (explicit != null) return Number(explicit);
    const rest = this.getTotalAmount(data) - this.getPaidAmount(data);
    return rest > 0 ? rest : 0;
  }

  /**
   * Type-specific lines for **invoice** mode (fields + fileName)
   */
  private getTypeFieldsForInvoice(
    data: any,
    source?: InvoiceSource
  ): {
    fields: Array<{ label: string; value: string }>;
    fileName: string;
  } {
    if (source === InvoiceSource.DELIVERY_inv) {
      const unitPrice = Number((data as any)?.unitPrice ?? 0);
      const qty = Number((data as any)?.oilQuantity ?? (data as any)?.oliveQuantity ?? 0);
      const total = this.getTotalAmount(data);
      const desc = (data as any)?.deliveryType || "Huile d'olive";
      const fileName = `Facture_${(data as any)?.deliveryNumber ?? 'inconnu'}.pdf`;

      return {
        fields: [
          { label: 'PDF.DESCRIPTION', value: desc },
          {
            label: 'PDF.PRICE_UNIT',
            value: `${unitPrice.toFixed(3)} TND/kg`
          },
          { label: 'PDF.QUANTITY', value: `${qty} kg` },
          { label: 'PDF.TOTAL', value: fmtMoney(total) }
        ],
        fileName
      };
    }

    if (source === InvoiceSource.OIL_SALE_inv) {
      const unitPrice = Number((data as any)?.unitPrice ?? 0);
      const qty = Number((data as any)?.quantity ?? 0);
      const total = this.getTotalAmount(data);
      const fileName = `Facture_Vente_${(data as any).invoiceNumber || (data as any)?.id || 'inconnu'}.pdf`;

      return {
        fields: [
          { label: 'PDF.DESCRIPTION', value: "Vente Huile d'olive" },
          {
            label: 'PDF.PRICE_UNIT',
            value: `${unitPrice.toFixed(3)} TND/kg`
          },
          { label: 'PDF.QUANTITY', value: `${qty} kg` },
          { label: 'PDF.TOTAL', value: fmtMoney(total) }
        ],
        fileName
      };
    }

    if (source === InvoiceSource.WASTE_SALE_inv) {
      const unitPrice = Number((data as any)?.unitPrice ?? 0);
      const qty = Number((data as any)?.quantityInKg ?? 0);
      const total = this.getTotalAmount(data);
      const desc = (data as any)?.description ?? `Vente de déchets (${(data as any)?.type ?? ''})`;
      const fileName = `Facture_Vente_Dechet_${(data as any)?.invoiceNumber || (data as any)?.id || 'inconnu'}.pdf`;

      return {
        fields: [
          { label: 'PDF.DESCRIPTION', value: desc },
          {
            label: 'PDF.PRICE_UNIT',
            value: `${unitPrice.toFixed(3)} TND/kg`
          },
          { label: 'PDF.QUANTITY', value: `${qty} kg` },
          { label: 'PDF.TOTAL', value: fmtMoney(total) }
        ],
        fileName
      };
    }

    // Fallback
    return { fields: [], fileName: `Facture_${Date.now()}.pdf` };
  }
}

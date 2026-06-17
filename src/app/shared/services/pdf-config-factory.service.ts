import { Injectable } from '@angular/core';
import { CompanyProfile } from '../models/CompanyProfile';
import { PdfFactureConfig, PdfInvoiceLineItem, PdfPaymentNoteConfig } from '../models/pdf-config.model';
import { TUNISIA_VAT_STANDARD_RATE } from '../constants/tunisia-vat.constants';
import { TranslateService } from '@ngx-translate/core';
import { UnifiedDelivery } from '../models/UnifiedDelivery';
import { resolveUnifiedDeliveryBillLine } from '../utils/unified-delivery-bill.util';
import { InvoiceSource } from '../../reception/suppliers/supplier-details/supplier-details.component';
import { CompanyProfileService } from './company-profile.service';
import { OperationType } from '../models/operation-type.enum';

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
  const s = (data as any)?.supplier;
  const first = s?.name ?? '';
  const last = s?.lastname ?? '';
  return `${first} ${last}`.trim();
}

function supplierPhoneLike(data: any): string {
  return (data as any)?.supplier?.phone ?? '';
}

function supplierAddressLike(data: any): string {
  return (data as any)?.supplier?.address ?? '';
}

@Injectable({ providedIn: 'root' })
export class PdfConfigFactoryService {
  private profile: CompanyProfile | null = null;
  private error: any | null = null;

  constructor(
    private translateService: TranslateService,
    private companyProfileService: CompanyProfileService
  ) {}

  /**
   * Build a PDF config (Facture or Payment Note).
   * @param data      UnifiedDelivery | OilSale | WasteSale
   * @param source    Source type to influence titles/labels (e.g.,  nvoiceSource.DELIVERY_inv | 'OIL_SALE' | 'WASTE_SALE' ... per your app)
   * @param configMode 'auto' (unpaid>0 → payment note), or force 'invoice' / 'paymentNote'
   */
  build(data: any, source: InvoiceSource, configMode: PdfConfigMode = 'auto'): PdfFactureConfig | PdfPaymentNoteConfig {
    // Load company profile from localStorage (safe parse)
    try {
      this.companyProfileService.getProfile().subscribe({
        next: (p) => {
          this.profile = p;
        },
        error: () => {
          this.error = 'Unable to load profile';
        }
      });
    } catch {
      this.profile = null;
    }

    const unpaid = this.getUnpaidAmount(data, source);
    const isPaymentNote = configMode === 'paymentNote' || (configMode === 'auto' && unpaid > 0);

    const nowStr = fmtDate();
    const companyInfo = buildCompanyInfo(this.profile!);

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
      { label: 'PDF.REFERENCE_DATE', value: this.getReferenceDate(data, source) }
    ];

    if (isPaymentNote) {
      // ---------- Payment Note ----------
      const total = this.getTotalAmount(data, source);
      const paid = this.getPaidAmount(data);

      const cfg: PdfPaymentNoteConfig = {
        title: 'PDF.NOTE_DE_PAIEMENT',
        reference: this.getReferenceDate(data, source),
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
    const invoiceRef =
      this.getInvoiceNumber(data, source) ||
      this.getReferenceDate(data, source);
    const lineItems =
      source === InvoiceSource.DELIVERY_inv
        ? this.buildUnifiedDeliveryLineItems(data as UnifiedDelivery)
        : this.buildLineItems(typeFields.fields, data, source);

    const facture: PdfFactureConfig = {
      title: 'PDF.COMMERCIAL_INVOICE',
      reference: invoiceRef,
      date: nowStr,
      currency: 'TND',
      conditions: String(this.getOperationType(data, source) || ''),
      defaultVatRatePercent: TUNISIA_VAT_STANDARD_RATE,

      clientInfo: {
        name: supplierNameLike(data),
        taxId: (data as any)?.supplier?.matriculeFiscal,
        addressLines: [supplierAddressLike(data), supplierPhoneLike(data)].filter(Boolean)
      },
      lineItems,

      companyInfo,
      footerContact: {
        companyName: companyInfo.companyName,
        phone: companyInfo.mobile
      },
      fileName: typeFields.fileName
    };

    return facture;
  }

  // =========================
  // Internals
  // =========================

  private buildUnifiedDeliveryLineItems(delivery: UnifiedDelivery): PdfInvoiceLineItem[] {
    const resolved = resolveUnifiedDeliveryBillLine(delivery);
    const description = this.translateService.instant(
      'DELIVERIES.OPERATION_TYPE.' + (delivery.operationType || '')
    );

    return [
      {
        description: description || (resolved.isOil ? "Huile d'olive" : 'Olives'),
        unitPrice: resolved.unitPrice,
        quantity: resolved.quantity,
        total: resolved.totalHt,
        unit: resolved.unit,
        vatRatePercent: TUNISIA_VAT_STANDARD_RATE
      }
    ];
  }

  private buildLineItems(
    fields: Array<{ label: string; value: string }>,
    data: any,
    source?: InvoiceSource
  ): PdfInvoiceLineItem[] {
    const byLabel: Record<string, string> = {};
    fields.forEach((f) => (byLabel[f.label] = f.value));

    const desc = byLabel['PDF.DESCRIPTION'] || this.getProductDescription(data, source);
    const unitPrice = this.parseNum(byLabel['PDF.PRICE_UNIT']);
    const quantity = this.parseNum(byLabel['PDF.QUANTITY']);
    let total = this.parseNum(byLabel['PDF.TOTAL']);
    if (!total && unitPrice && quantity) {
      total = unitPrice * quantity;
    }
    if (!total) {
      total = this.getTotalAmount(data, source);
    }

    return [{ description: desc, unitPrice, quantity, total, vatRatePercent: TUNISIA_VAT_STANDARD_RATE }];
  }

  private getProductDescription(data: any, source?: InvoiceSource): string {
    if (source === InvoiceSource.OIL_SALE_inv) {
      return "Vente Huile d'olive";
    }
    if (source === InvoiceSource.WASTE_SALE_inv) {
      return (data as any)?.description ?? `Vente de déchets (${(data as any)?.type ?? ''})`;
    }
    return '';
  }

  private parseNum(value?: string): number {
    if (!value) return 0;
    const match = String(value).replace(',', '.').match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  private getOperationType(data: any, source?: InvoiceSource): any {
    if (source === InvoiceSource.DELIVERY_inv) {
      return this.translateService.instant('DELIVERIES.OPERATION_TYPE.' + data.operationType);
    }
    if (source === InvoiceSource.OIL_SALE_inv) return (data as any)?.type || 'VENTE HUILE';
    if (source === InvoiceSource.WASTE_SALE_inv) return (data as any)?.type || 'VENTE DECHET';
  }

  private getReferenceDate(data: any, source: InvoiceSource): string {
    if (source === InvoiceSource.DELIVERY_inv) {
      switch ((data as UnifiedDelivery).operationType) {
        case OperationType.DECHET:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.PAYMENT:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.SIMPLE_RECEPTION:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.EXCHANGE:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.OIL_PURCHASE:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.BASE:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
        case OperationType.OLIVE_PURCHASE:
          return `N°${data.deliveryNumber} / ${new Date().getFullYear().toString().slice(-2)}`;
      }
    }
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

  private getUnpaidAmount(data: any, source: any): number {
    const explicit = (data as any)?.unpaidAmount;
    if (explicit != null) return Number(explicit);
    const rest = this.getTotalAmount(data, source) - this.getPaidAmount(data);
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
      const fileName = `Facture_${(data as any)?.deliveryNumber ?? 'inconnu'}.pdf`;
      return { fields: [], fileName };
    }

    if (source === InvoiceSource.OIL_SALE_inv) {
      const unitPrice = Number((data as any)?.unitPrice ?? 0);
      const qty = Number((data as any)?.quantity ?? 0);
      const total = this.getTotalAmount(data, source);
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
      const total = this.getTotalAmount(data, source);
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

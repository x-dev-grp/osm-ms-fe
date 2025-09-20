import { Injectable } from '@angular/core';
import { PdfFactureConfig } from '../../shared/models/pdf-config.model';
import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { WasteSale } from '../models/Waste.model';
import { OilSale } from '../models/oil-sale.model';
import { OperationType } from '../../shared/models/operation-type.enum';
import { Observable, map, of } from 'rxjs';

export enum InvoiceType {
  TRITURATION = 'TRITURATION',
  OIL_SALE = 'OIL_SALE',
  WASTE_SALE = 'WASTE_SALE'
}

export interface CompanyInfoForPdf {
  logoUrl?: string;
  companyName: string;
  address: string;
  vatNumber?: string;
  mobile?: string;
  website?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceConfigService {
  constructor(private companyProfileService: CompanyProfileService) {}

  /**
   * Generate PDF configuration based on operation type and data
   * Company information is fetched automatically from the service
   */
  generateInvoiceConfig(
    type: InvoiceType,
    data: UnifiedDelivery | OilSale | WasteSale,
    additionalParams?: { triturationPrice?: number }
  ): Observable<PdfFactureConfig> {
    return this.companyProfileService.getProfile().pipe(
      map((response) => {
        const company = response;
        if (!company) {
          throw new Error('Company profile not found');
        }

        switch (type) {
          case InvoiceType.TRITURATION:
            return this.createTriturationConfig(
              data as UnifiedDelivery,
              company,
              additionalParams?.triturationPrice || 0
            );

          case InvoiceType.OIL_SALE:
            return this.createOilSaleConfig(data as OilSale, company);

          case InvoiceType.WASTE_SALE:
            return this.createWasteSaleConfig(data as WasteSale, company);

          default:
            throw new Error(`Unsupported invoice type: ${type}`);
        }
      })
    );
  }

  /**
   * Automatically determine invoice type based on operation or data type
   */
  determineInvoiceType(data: UnifiedDelivery | OilSale | WasteSale): InvoiceType {
    // Check if it's a UnifiedDelivery with trituration operation
    if (this.isUnifiedDelivery(data)) {
      const operationType = (data as UnifiedDelivery).operationType;
      if (this.isTriturationService(operationType)) {
        return InvoiceType.TRITURATION;
      }
      if (operationType === OperationType.OIL_PURCHASE) {
        return InvoiceType.OIL_SALE;
      }
    }

    // Check if it's an OilSale
    if (this.isOilSale(data)) {
      return InvoiceType.OIL_SALE;
    }

    // Check if it's a WasteSale
    if (this.isWasteSale(data)) {
      return InvoiceType.WASTE_SALE;
    }

    throw new Error('Unable to determine invoice type from provided data');
  }

  /**
   * Generate invoice configuration with automatic type detection
   * Company information is fetched automatically from the service
   */
  generateAutoInvoiceConfig(
    data: UnifiedDelivery | OilSale | WasteSale,
    additionalParams?: { triturationPrice?: number }
  ): Observable<PdfFactureConfig> {
    const type = this.determineInvoiceType(data);
    return this.generateInvoiceConfig(type, data, additionalParams);
  }

  // Private helper methods for configuration generation

  /**
   * Format company profile into PDF company info structure
   */
  private formatCompanyInfo(company: CompanyProfile): CompanyInfoForPdf {
    return {
      logoUrl: company.logoData ? `data:${company.logoContentType || 'image/png'};base64,${company.logoData}` : undefined,
      companyName: company.legalName,
      address: this.formatCompanyAddress(company),
      vatNumber: company.taxId,
      mobile: company.phone || '',
      website: company.website || company.email || ''
    };
  }

  /**
   * Format company address from profile data
   */
  private formatCompanyAddress(company: CompanyProfile): string {
    const addressParts = [
      company.addressLine1,
      company.city,
      company.postalCode,
      company.governorate
    ].filter(Boolean);

    return addressParts.join(', ');
  }

  private createTriturationConfig(delivery: UnifiedDelivery, company: CompanyProfile, triturationPrice: number): PdfFactureConfig {
    const serviceAmount = delivery.poidsNet * triturationPrice;
    const paidAmount = delivery.paidAmount || 0;
    const unpaidAmount = serviceAmount - paidAmount;
    const paymentStatus = this.getPaymentStatus(paidAmount, serviceAmount);
    const companyInfo = this.formatCompanyInfo(company);

    return {
      title: 'FACTURE ' + (delivery.lotNumber ?? 'Sans titre'),
      reference: `${delivery.lotNumber || 'XXXX'} PDF.TRITURATION`,
      date: new Date().toLocaleDateString(),

      companyInfo,

      generalInfo: [
        {
          label: 'PDF.CUSTOMER',
          value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`.trim()
        },
        { label: 'PDF.PHONE', value: delivery.supplier?.supplierInfo?.phone || '' },
        {
          label: 'PDF.ADDRESS',
          value: delivery.supplier?.supplierInfo?.address || ''
        },
        {
          label: 'PDF.REGION',
          value: this.getRegionValue(delivery.supplier?.supplierInfo?.region)
        },
        { label: 'PDF.INVOICE_DATE', value: new Date().toLocaleDateString() },
        {
          label: 'PDF.DELIVERY_DATE',
          value: new Date(delivery.deliveryDate).toLocaleDateString()
        }
      ],

      fields: [
        { label: 'PDF.SERVICE_DESCRIPTION', value: 'PDF.TRITURATION_SERVICE' },
        {
          label: 'PDF.PRICE_UNIT',
          value: `${triturationPrice.toFixed(3)} TND/kg`
        },
        { label: 'PDF.QUANTITY', value: `${delivery.poidsNet} kg` },
        {
          label: 'PDF.TOTAL_SERVICE_AMOUNT',
          value: `${serviceAmount.toFixed(3)} TND`
        },
        { label: 'PDF.PAID_AMOUNT', value: `${paidAmount.toFixed(3)} TND` },
        {
          label: 'PDF.UNPAID_AMOUNT',
          value: `${unpaidAmount.toFixed(3)} TND`
        },
        { label: 'PDF.PAYMENT_STATUS', value: paymentStatus }
      ],

      fileName: `Facture_Trituration_${delivery.deliveryNumber || 'inconnu'}.pdf`
    };
  }

  private createOilSaleConfig(
    oilSale: OilSale,
    company: CompanyProfile
  ): PdfFactureConfig {
    const unitPrice = oilSale.unitPrice ?? 8.5;
    const totalAmount = oilSale.totalAmount;
    const paidAmount = oilSale.paidAmount || 0;
    const unpaidAmount = oilSale.unpaidAmount || totalAmount - paidAmount;
    const paymentStatus = this.getPaymentStatus(paidAmount, totalAmount);
    const companyInfo = this.formatCompanyInfo(company);

    return {
      title: 'FACTURE ' + (oilSale.invoiceNumber ?? 'Sans titre'),
      reference: `${oilSale.invoiceNumber || 'XXXX'} PDF.VENTE_HUILE`,
      date: new Date().toLocaleDateString(),

      companyInfo,

      generalInfo: [
        {
          label: 'PDF.CUSTOMER',
          value: `${oilSale.supplier?.supplierInfo?.name || ''} ${oilSale.supplier?.supplierInfo?.lastname || ''}`.trim()
        },
        { label: 'PDF.PHONE', value: oilSale.supplier?.supplierInfo?.phone || '' },
        {
          label: 'PDF.ADDRESS',
          value: oilSale.supplier?.supplierInfo?.address || ''
        },
        {
          label: 'PDF.REGION',
          value: this.getRegionValue(oilSale.supplier?.supplierInfo?.region)
        },
        {
          label: 'PDF.INVOICE_DATE',
          value: new Date().toLocaleDateString()
        },
        {
          label: 'PDF.SALE_DATE',
          value: new Date(oilSale.saleDate).toLocaleDateString()
        }
      ],

      fields: [
        {
          label: 'PDF.DESCRIPTION',
          value: oilSale.description || 'PDF.EXTRA_VIRGIN_OLIVE_OIL'
        },
        {
          label: 'PDF.PRICE_UNIT',
          value: `${unitPrice.toFixed(3)} TND/kg`
        },
        {
          label: 'PDF.QUANTITY',
          value: `${oilSale.quantity} kg`
        },
        {
          label: 'PDF.TOTAL_AMOUNT',
          value: `${totalAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.PAID_AMOUNT',
          value: `${paidAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.UNPAID_AMOUNT',
          value: `${unpaidAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.PAYMENT_STATUS',
          value: paymentStatus
        }
      ],

      fileName: `Facture_VenteHuile_${oilSale.invoiceNumber || 'inconnu'}.pdf`
    };
  }

  private createWasteSaleConfig(
    wasteSale: WasteSale,
    company: CompanyProfile
  ): PdfFactureConfig {
    const unitPrice = wasteSale.unitPrice || 0;
    const quantity = wasteSale.quantityInKg || 0;
    const totalAmount = wasteSale.totalPrice;
    const paidAmount = wasteSale.paidAmount || 0;
    const unpaidAmount = wasteSale.unpaidAmount || totalAmount - paidAmount;
    const paymentStatus = this.getPaymentStatus(paidAmount, totalAmount);
    const companyInfo = this.formatCompanyInfo(company);

    return {
      title: 'FACTURE ' + (wasteSale.invoiceNumber ?? 'Sans titre'),
      reference: `${wasteSale.invoiceNumber || 'XXXX'} PDF.VENTE_DECHET`,
      date: new Date().toLocaleDateString(),

      companyInfo,

      generalInfo: [
        {
          label: 'PDF.CUSTOMER',
          value: `${wasteSale.supplier?.supplierInfo?.name || ''} ${wasteSale.supplier?.supplierInfo?.lastname || ''}`.trim()
        },
        { label: 'PDF.PHONE', value: wasteSale.supplier?.supplierInfo?.phone || '' },
        {
          label: 'PDF.ADDRESS',
          value: wasteSale.supplier?.supplierInfo?.address || ''
        },
        {
          label: 'PDF.REGION',
          value: this.getRegionValue(wasteSale.supplier?.supplierInfo?.region)
        },
        { label: 'PDF.INVOICE_DATE', value: new Date().toLocaleDateString() },
        {
          label: 'PDF.SALE_DATE',
          value: new Date(wasteSale.saleDate).toLocaleDateString()
        }
      ],

      fields: [
        {
          label: 'PDF.DESCRIPTION',
          value: wasteSale.description || 'PDF.WASTE_PROCESSING'
        },
        {
          label: 'PDF.PRICE_UNIT',
          value: `${unitPrice.toFixed(3)} TND/kg`
        },
        {
          label: 'PDF.QUANTITY',
          value: `${quantity} kg`
        },
        {
          label: 'PDF.TOTAL_AMOUNT',
          value: `${totalAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.PAID_AMOUNT',
          value: `${paidAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.UNPAID_AMOUNT',
          value: `${unpaidAmount.toFixed(3)} TND`
        },
        {
          label: 'PDF.PAYMENT_STATUS',
          value: paymentStatus
        }
      ],

      fileName: `Facture_Dechet_${wasteSale.invoiceNumber || 'inconnu'}.pdf`
    };
  }

  // Utility methods

  private getRegionValue(region: any): string {
    if (typeof region === 'string') {
      return region;
    }
    if (region && typeof region === 'object' && region.name) {
      return region.name;
    }
    return '';
  }

  private getPaymentStatus(paidAmount: number, totalAmount: number): string {
    if (paidAmount >= totalAmount) {
      return 'PDF.PAID';
    } else if (paidAmount > 0) {
      return 'PDF.PARTIALLY_PAID';
    } else {
      return 'PDF.UNPAID';
    }
  }

  private isTriturationService(operationType?: OperationType): boolean {
    return operationType === OperationType.SIMPLE_RECEPTION || operationType === OperationType.BASE;
  }

  private isUnifiedDelivery(data: any): data is UnifiedDelivery {
    return data && 'deliveryNumber' in data && 'operationType' in data;
  }

  private isOilSale(data: any): data is OilSale {
    return data && 'quantity' in data && 'unitPrice' in data && 'saleDate' in data && 'qualityGrade' in data;
  }

  private isWasteSale(data: any): data is WasteSale {
    return data && 'quantityInKg' in data && 'type' in data && 'wasteSale' in data.constructor.name.toLowerCase();
  }
}

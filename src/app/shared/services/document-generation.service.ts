import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type DeliveryDocumentType = 'reception' | 'quality-control' | 'production' | 'commercial';

export type OilTransactionDocumentType = 'transaction' | 'sortie';

/**
 * Unified client for backend document generation.
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentGenerationService {
  private readonly deliveryBaseUrl = `${environment.apiUrl}/api/documents/deliveries`;
  private readonly oilTransactionBaseUrl = `${environment.apiUrl}/api/documents/oil-transactions`;
  private readonly oilSaleBaseUrl = `${environment.apiUrl}/api/documents/oil-sales`;
  private readonly expeditionBaseUrl = `${environment.apiUrl}/api/documents/expeditions`;
  private readonly projectBaseUrl = `${environment.apiUrl}/api/documents/projects`;

  constructor(private http: HttpClient) {}

  downloadDeliveryDocument(id: string, type: DeliveryDocumentType): void {
    this.downloadPdf(`${this.deliveryBaseUrl}/${id}/${type}`);
  }

  downloadReceptionPdf(id: string): void {
    this.downloadDeliveryDocument(id, 'reception');
  }

  downloadQualityControlPdf(id: string): void {
    this.downloadDeliveryDocument(id, 'quality-control');
  }

  downloadProductionPdf(id: string): void {
    this.downloadDeliveryDocument(id, 'production');
  }

  downloadCommercialPdf(deliveryId: string): void {
    this.downloadDeliveryDocument(deliveryId, 'commercial');
  }

  downloadOilTransactionPdf(id: string, type: OilTransactionDocumentType = 'transaction'): void {
    this.downloadPdf(`${this.oilTransactionBaseUrl}/${id}/${type}`);
  }

  downloadOilTransactionReceiptPdf(id: string): void {
    this.downloadOilTransactionPdf(id, 'transaction');
  }

  downloadOilSortiePdf(id: string): void {
    this.downloadOilTransactionPdf(id, 'sortie');
  }

  downloadOilSaleBonCommandePdf(oilSaleId: string): void {
    this.downloadPdf(`${this.oilSaleBaseUrl}/${oilSaleId}/bon-commande`);
  }

  downloadOilSaleInvoicePdf(oilSaleId: string): void {
    this.downloadPdf(`${this.oilSaleBaseUrl}/${oilSaleId}/invoice`);
  }

  downloadOilSaleBonLivraisonPdf(oilSaleId: string): void {
    this.downloadPdf(`${this.oilSaleBaseUrl}/${oilSaleId}/bon-livraison`);
  }

  downloadExpeditionPdf(expeditionId: string): void {
    this.downloadPdf(`${this.expeditionBaseUrl}/${expeditionId}`);
  }

  downloadProjectTraceabilityPdf(projectId: string): void {
    this.downloadPdf(`${this.projectBaseUrl}/${projectId}/traceability`);
  }

  private downloadPdf(url: string): void {
    this.http.get(url, { observe: 'response', responseType: 'blob' }).subscribe({
      next: (response) => this.openPdfBlob(response),
      error: (error) => console.error('Failed to download document PDF', error)
    });
  }

  private openPdfBlob(response: HttpResponse<Blob>): void {
    const blob = response.body;
    if (!blob) {
      return;
    }
    const fileName = this.extractFileName(response.headers.get('content-disposition'));
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.target = '_blank';
    if (fileName) {
      anchor.download = fileName;
    }
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  private extractFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }
    const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1]);
    }
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    return match?.[1] ?? null;
  }
}

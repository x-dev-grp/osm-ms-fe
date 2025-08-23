import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { UnifiedDelivery } from '../models/UnifiedDelivery';
import { environment } from '../../../environments/environment';
import { OliveLotStatus } from '../models/OliveLotStatus';
import { ExchangePricingDto } from '../models/ExchangePricingDto';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UnifiedDeliveryService {
  private baseUrl = environment.apiUrl + '/api/production/deliveries';

  constructor(private http: HttpClient) {}

  // Get all deliveries with pagination.
  getAllDeliveries(page: number, size: number): Observable<ApiResponse<never>> {
    return this.http.get<ApiResponse<never>>(`${this.baseUrl}/fetchAll?page=${page}&size=${size}`);
  }

  getAllDeliveriesList(): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/fetchAll`);
  }

  getAllDeliveriesListForPlanning(): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/planning`);
  }

  // Retrieve a single UnifiedDeliverycc by ID.
  getUnifiedDelivery(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fetch/${id}`);
  }

  // Create a new UnifiedDeliverycc. The UnifiedDeliverycc payload may include qualityControlResults.
  createUnifiedDelivery(UnifiedDelivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.post<ApiResponse<UnifiedDelivery>>(this.baseUrl, UnifiedDelivery);
  }

  // Create a new UnifiedDeliverycc. The UnifiedDeliverycc payload may include qualityControlResults.
  createOilDeliveryFromOlive(uuid: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/createOilRecFromOliveRec/${uuid}`);
  }

  createOilTransactionFromExchange(uuid: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/createOilTransactionFromExchange/${uuid}`);
  }

  // Update an existing UnifiedDeliverycc.
  updateUnifiedDelivery(UnifiedDelivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.put<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}`, UnifiedDelivery);
  }

  // Delete a UnifiedDeliverycc by ID.
  deleteUnifiedDelivery(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
//todo change it to new endpoint , updte statue to  creat the oil transaction with waitng statue
  updateDelivery(delivery: UnifiedDelivery): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.put<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}`, delivery);
  }

  // Get deliveries by supplier ID for payment history
  getDeliveriesBySupplier(supplierId: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/supplier/${supplierId}`);
  }
  getDeliveryByOliveLotNumber(id: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/getDeliveryByOliveLotNumber/${id}`);
  }
  getDeliveryByLotNumber(lotNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getDeliveryByLotNumber/${lotNumber}`);
  }

  // Get paid deliveries by supplier ID
  getPaidDeliveriesBySupplier(supplierId: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/supplier/${supplierId}/paid`);
  }

  // Get unpaid deliveries by supplier ID
  getUnpaidDeliveriesBySupplier(supplierId: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/supplier/${supplierId}/unpaid`);
  }

  updateStatus(id: string, status: OliveLotStatus): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.baseUrl}/updateStatue/${id}/${status}`);
  }
  updatePricing(id: string, price: number): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.baseUrl}/updateprice/${id}/${price}`);
  }

  /**
   * Update pricing for exchange deliveries and create oil transaction
   * @param exchangePricingDto DTO containing all exchange pricing data
   */
  updatePricingAndCreatOilTransactionOut(exchangePricingDto: ExchangePricingDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/update-exchange-pricing`, exchangePricingDto);
  }

  updatePrincingForPaymentreception(dto: ExchangePricingDto): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/update-payment-pricing`, dto);
  }

  /**
   * Get the related oil delivery for a given olive lot number (for payment)
   * Looks for oil deliveries with operationType 'PAYMENT' and matching lotOliveNumber
   */
  getRelatedOilDelivery(oliveLotNumber: string, supplierId: string): Observable<UnifiedDelivery | null> {
    return this.getDeliveriesBySupplier(supplierId).pipe(
      map((response) => {
        if (response.success && response.data) {
          const deliveries = Array.isArray(response.data) ? response.data : [response.data];
          const match = deliveries.find((delivery: UnifiedDelivery) =>
            delivery.deliveryType === 'OIL' &&
            delivery.operationType === 'PAYMENT' &&
            delivery.lotOliveNumber === oliveLotNumber
          );
          return match || null;
        }
        return null;
      })
    );
  }

  processPayment(payload:any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/payment`, payload);
  }
}

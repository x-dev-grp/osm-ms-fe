import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { UnifiedDelivery } from '../models/UnifiedDelivery';
import { environment } from '../../../environments/environment';
import { OliveLotStatus } from '../models/OliveLotStatus';
import { ExchangePricingDto } from '../models/ExchangePricingDto';
import { deliveryType } from '../models/deleveryType';
import { QrCodeInfo, QrResolveResponse } from '../models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class UnifiedDeliveryService {
  private baseUrl = environment.apiUrl + '/api/production/deliveries';

  constructor(private http: HttpClient) {}



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

  getDeliveryByOliveLotNumber(id: string): Observable<ApiResponse<UnifiedDelivery>> {
    return this.http.get<ApiResponse<UnifiedDelivery>>(`${this.baseUrl}/getDeliveryByOliveLotNumber/${id}`);
  }

  getDeliveryByLotNumber(lotNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getDeliveryByLotNumber/${lotNumber}`);
  }

  getDeliveryByLotNumberAndType(lotNumber: string, type: deliveryType): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getDeliveryByLotNumber/${lotNumber}/${type}`);
  }

  updateStatus(id: string, status: OliveLotStatus, cause?: string): Observable<ApiResponse<void>> {
    let params = new HttpParams();
    if (cause) params = params.set('cause', String(cause));

    return this.http.get<ApiResponse<void>>(`${this.baseUrl}/updateStatue/${encodeURIComponent(id)}/${status}`, { params });
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

  processPayment(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/payment`, payload);
  }

  getDeliveriesByGlobalLotNumber(glotNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getDeliveriesByGlobalLotNumber/${glotNumber}`);
  }

  generateQr(deliveryId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(`${this.baseUrl}/qr/UNIFIEDDELIVERY/${deliveryId}`);
  }

  searchByCode(code: string): Observable<QrResolveResponse> {
    return this.http.get<QrResolveResponse>(`${this.baseUrl}/search/by-code`, { params: { code } });
  }
}

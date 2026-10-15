import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { OilTransactionService } from './OilTransactionService';
import { OilTransaction } from '../models/OilTransaction';

describe('OilTransactionService', () => {
  const baseUrl = `${environment.apiUrl}/api/production/oil_transaction`;
  let service: OilTransactionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(OilTransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('updates through the generic PUT endpoint with the id in the body', () => {
    service.update('tx-1', { quantityKg: 10 } as Partial<OilTransaction>).subscribe();

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.id).toBe('tx-1');
    req.flush({});
  });

  it('updateOilTransaction uses the generic PUT endpoint', () => {
    service.updateOilTransaction({ id: 'tx-2' } as OilTransaction).subscribe();

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deletes through the soft-delete endpoint', () => {
    service.deleteOilTransaction('tx-3').subscribe();

    const req = http.expectOne(`${baseUrl}/delete/tx-3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, message: '', data: undefined });
  });
});

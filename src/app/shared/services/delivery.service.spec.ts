import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { OliveLotStatus } from '../models/OliveLotStatus';
import { UnifiedDeliveryService } from './delivery.service';

describe('UnifiedDeliveryService mutation endpoints', () => {
  let service: UnifiedDeliveryService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/production/deliveries`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(UnifiedDeliveryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an oil reception through POST', () => {
    service.createOilDeliveryFromOlive('delivery-1').subscribe();
    const req = http.expectOne(`${base}/createOilRecFromOliveRec/delivery-1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ success: true });
  });

  it('updates delivery status through POST and preserves cause', () => {
    service.updateStatus('delivery/1', OliveLotStatus.COMPLETED, 'approved').subscribe();
    const req = http.expectOne((candidate) => candidate.url === `${base}/updateStatue/delivery%2F1/COMPLETED`);
    expect(req.request.method).toBe('POST');
    expect(req.request.params.get('cause')).toBe('approved');
    req.flush({ success: true });
  });

  it('updates pricing through POST', () => {
    service.updatePricing('delivery-1', 12.5).subscribe();
    const req = http.expectOne(`${base}/updateprice/delivery-1/12.5`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
});

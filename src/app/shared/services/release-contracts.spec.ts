import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AdminDashboardService } from '../../administration/services/admin-dashboard.service';
import { FiltrationApiService } from './filtration-api.service';
import { PlanningService } from './planning.service';
import { QualityControlResultService } from './quality-control-result.service';

describe('Consolidated backend release contracts', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the production planning endpoints', () => {
    const service = TestBed.inject(PlanningService);
    const base = `${environment.apiUrl}/api/production/planning`;

    service.getPlanning().subscribe();
    expect(http.expectOne(base).request.method).toBe('GET');

    service.savePlanning({} as never).subscribe();
    expect(http.expectOne(base).request.method).toBe('POST');

    service.completeLotWithDetails('LOT-1', 80, 20, 0, true).subscribe();
    expect(http.expectOne(`${base}/lots/LOT-1/completed`).request.method).toBe('POST');
  });

  it('uses the production quality-control endpoints', () => {
    const service = TestBed.inject(QualityControlResultService);
    const base = `${environment.apiUrl}/api/production/qualitycontrolresult`;

    service.getAllResultsByDeliveryID('delivery-1').subscribe();
    expect(http.expectOne(`${base}/fetchByDelivery/delivery-1`).request.method).toBe('GET');

    service.createResults([]).subscribe();
    expect(http.expectOne(`${base}/save-batch`).request.method).toBe('POST');

    service.saveResultsForFiltration('filter-1', []).subscribe();
    expect(http.expectOne(`${base}/filtration/filter-1/save-batch`).request.method).toBe('POST');
  });

  it('uses the production filtration lifecycle endpoints', () => {
    const service = TestBed.inject(FiltrationApiService);
    const base = `${environment.apiUrl}/api/production/filtration`;

    service.start('filter-1').subscribe();
    expect(http.expectOne(`${base}/filter-1/start`).request.method).toBe('PUT');

    service.complete('filter-1', { volumeAfter: 90 } as never).subscribe();
    expect(http.expectOne(`${base}/filter-1/complete`).request.method).toBe('PUT');

    service.delete('filter-1').subscribe();
    expect(http.expectOne(`${base}/filter-1`).request.method).toBe('DELETE');
  });

  it('uses the consolidated administrator dashboard endpoint', () => {
    const service = TestBed.inject(AdminDashboardService);
    service.getStats().subscribe();
    const request = http.expectOne(`${environment.apiUrl}/api/security/admin/dashboard/stats`);
    expect(request.request.method).toBe('GET');
  });
});

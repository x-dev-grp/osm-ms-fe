import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { SupportTicketService } from './support-ticket.service';
import { environment } from '../../../environments/environment';

describe('SupportTicketService', () => {
  let service: SupportTicketService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SupportTicketService, { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } }]
    });

    service = TestBed.inject(SupportTicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a ticket', () => {
    service.create({ subject: 'Test', description: 'Something broke' }).subscribe((ticket) => {
      expect(ticket?.subject).toBe('Test');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/security/support-tickets`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { id: '1', subject: 'Test', description: 'Something broke', status: 'OPEN', priority: 'NORMAL' } });
  });

  it('lists tickets with scope', () => {
    service.list(0, 10, 'all').subscribe((response) => {
      expect(response.success).toBeTrue();
      expect(response.data.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/security/support-tickets?page=0&size=10&scope=all`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [{ id: '1', subject: 'A', status: 'OPEN', priority: 'NORMAL' }], total: 1, page: 1, totalPages: 1 });
  });
});

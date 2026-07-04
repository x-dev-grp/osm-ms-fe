import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { TokenService } from './tokenService.service';
import { UserService } from '../../settings/user-management/services/user.service';
import { PermissionService } from '../../settings/user-management/services/permission.service';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AppConfig } from 'src/environments/environment';

describe('AuthenticationService login', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthenticationService,
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: TokenService, useValue: { getToken: () => null, setToken: () => {}, clearTokens: () => {} } },
        { provide: UserService, useValue: {} },
        { provide: PermissionService, useValue: { clearCache: () => {} } },
        { provide: CompanyProfileService, useValue: { clearCache: () => {} } },
        { provide: NotificationService, useValue: { stopPolling: () => {} } }
      ]
    });
    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST TOKEN grant to oauth2/token with form body', () => {
    service.login({ username: 'oosmAdmin', password: 'secret' }).subscribe();

    const req = httpMock.expectOne(AppConfig.authentication.authorization);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(req.request.body).toContain('grant_type=TOKEN');
    expect(req.request.body).toContain('client_id=oosm-client');
    expect(req.request.body).toContain('username=oosmAdmin');
    expect(req.request.body).toContain('password=secret');

    req.flush({ access_token: 'tok', refresh_token: 'ref' });
  });
});

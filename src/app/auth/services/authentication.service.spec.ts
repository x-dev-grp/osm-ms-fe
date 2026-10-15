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
import { of } from 'rxjs';
import { Role } from '../../theme/types/role';

describe('AuthenticationService login', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;
  let companyProfileService: jasmine.SpyObj<CompanyProfileService>;

  beforeEach(() => {
    companyProfileService = jasmine.createSpyObj<CompanyProfileService>('CompanyProfileService', ['clearCache', 'getProfile']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthenticationService,
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: TokenService, useValue: { getToken: () => null, setToken: () => {}, clearTokens: () => {} } },
        { provide: UserService, useValue: {} },
        { provide: PermissionService, useValue: { clearCache: () => {} } },
        { provide: CompanyProfileService, useValue: companyProfileService },
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

  it('loads tenant modules from the profile when refresh does not provide them', async () => {
    service.setCurrentUserValue = {
      id: 'user-1', email: '', password: '', phoneNumber: '', confirmationMethod: '',
      isLocked: false, role: Role.Admin, permissions: [], tenantId: 'tenant-1'
    };
    companyProfileService.getProfile.and.returnValue(of({ enabledModules: ['finance', 'storage'] } as any));

    const result = service.ensureSessionContext();
    httpMock.expectOne((request) => request.url.endsWith('/api/security/user/me/refresh-session')).flush({});
    await result;

    expect(companyProfileService.getProfile).toHaveBeenCalledWith({ forceRefresh: true });
    expect(service.getTenantEnabledModules()).toEqual(['FINANCE', 'STORAGE']);
  });

  it('deduplicates concurrent session-context requests', async () => {
    service.setCurrentUserValue = {
      id: 'user-1', email: '', password: '', phoneNumber: '', confirmationMethod: '',
      isLocked: false, role: Role.Admin, permissions: [], tenantId: 'tenant-1'
    };
    companyProfileService.getProfile.and.returnValue(of({ enabledModules: ['reception'] } as any));

    const first = service.ensureSessionContext();
    const second = service.ensureSessionContext();
    expect(second).toBe(first);
    httpMock.expectOne((request) => request.url.endsWith('/api/security/user/me/refresh-session')).flush({});
    await Promise.all([first, second]);

    expect(companyProfileService.getProfile).toHaveBeenCalledTimes(1);
  });
});

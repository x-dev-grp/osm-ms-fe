import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from '../auth/services/authentication.service';
import { DashboardHubService } from './dashboard-hub.service';

describe('DashboardHubService', () => {
  let auth: jasmine.SpyObj<AuthenticationService>;
  let service: DashboardHubService;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthenticationService>('AuthenticationService', ['isOosmAdmin', 'hasModule', 'hasPermission']);
    TestBed.configureTestingModule({
      providers: [DashboardHubService, { provide: AuthenticationService, useValue: auth }]
    });
    service = TestBed.inject(DashboardHubService);
  });

  it('shows only the administration tab to the platform admin', () => {
    auth.isOosmAdmin.and.returnValue(true);
    auth.hasModule.and.returnValue(true);
    auth.hasPermission.and.returnValue(true);

    expect(service.getVisibleTabs().map((tab) => tab.id)).toEqual(['administration']);
  });

  it('keeps module tabs and hides administration for tenant users', () => {
    auth.isOosmAdmin.and.returnValue(false);
    auth.hasModule.and.returnValue(true);
    auth.hasPermission.and.returnValue(true);

    expect(service.getVisibleTabs().map((tab) => tab.id)).toEqual([
      'overview',
      'reception',
      'finance',
      'storage',
      'inventory',
      'hr',
      'analytics'
    ]);
  });

  it('shows only the overview to tenant users without module access', () => {
    auth.isOosmAdmin.and.returnValue(false);
    auth.hasModule.and.returnValue(false);
    auth.hasPermission.and.returnValue(false);

    expect(service.getVisibleTabs().map((tab) => tab.id)).toEqual(['overview']);
  });
});

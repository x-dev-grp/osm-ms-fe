import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { allPermissionGuard, anyPermissionGuard, moduleGuard } from './permission.guard';

describe('permission guards', () => {
  let auth: any;
  let router: any;

  beforeEach(() => {
    const deniedTree = { denied: true };
    auth = {
      ensureSessionContext: jasmine.createSpy('ensureSessionContext').and.resolveTo(),
      hasAllPermissions: jasmine.createSpy('hasAllPermissions').and.returnValue(false),
      hasAnyPermission: jasmine.createSpy('hasAnyPermission').and.returnValue(false),
      hasAnyModule: jasmine.createSpy('hasAnyModule').and.returnValue(false),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(false),
      isOosmAdmin: jasmine.createSpy('isOosmAdmin').and.returnValue(false)
    };
    router = { createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(deniedTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('hydrates the session before allowing all required permissions', async () => {
    auth.hasAllPermissions.and.returnValue(true);
    const result = await TestBed.runInInjectionContext(() => allPermissionGuard(['A'])({} as any, {} as any));
    expect(result).toBeTrue();
    expect(auth.ensureSessionContext).toHaveBeenCalledBefore(auth.hasAllPermissions);
  });

  it('redirects when none of the required permissions are present', async () => {
    const result = await TestBed.runInInjectionContext(() => anyPermissionGuard(['A'])({} as any, {} as any));
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/access-denied']);
  });

  it('allows an OOSM administrator through module guards', async () => {
    auth.isOosmAdmin.and.returnValue(true);
    const result = await TestBed.runInInjectionContext(() => moduleGuard(['PRODUCTION'])({} as any, {} as any));
    expect(result).toBeTrue();
  });
});

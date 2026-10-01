import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HelpComponent } from './help.component';
import { AuthenticationService } from '../auth/services/authentication.service';
import { Role } from '../theme/types/role';
import { of } from 'rxjs';
import { SupportTicketService } from '../shared/services/support-ticket.service';
import { MillPlanningConfigService } from '../shared/services/mill-planning-config.service';
import { MatDialog } from '@angular/material/dialog';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;

  const authStub = {
    currentUserValue: {
      firstName: 'Test',
      lastName: 'User',
      username: 'testUser',
      email: 'test@example.com',
      role: Role.Admin
    },
    hasModule: () => true,
    hasPermission: () => true,
    hasAnyPermission: () => true
  };
  const supportTicketStub = {
    list: jasmine.createSpy('list').and.returnValue(of({ success: true, data: [], total: 0 })),
    openCreateDialog: jasmine.createSpy('openCreateDialog')
  };
  const millPlanningStub = {
    isEnabled: jasmine.createSpy('isEnabled').and.returnValue(of(true))
  };
  const dialogStub = {
    open: jasmine.createSpy('open')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: AuthenticationService, useValue: authStub },
        { provide: SupportTicketService, useValue: supportTicketStub },
        { provide: MillPlanningConfigService, useValue: millPlanningStub },
        { provide: MatDialog, useValue: dialogStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and show modules for admin', () => {
    expect(component).toBeTruthy();
    expect(component.modules.length).toBeGreaterThan(0);
    expect(component.commonTasks.length).toBeGreaterThan(0);
  });

  it('should render navigation and FAQ sections', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.help-page__nav')).toBeTruthy();
    expect(el.querySelector('#help-faq')).toBeTruthy();
    expect(el.querySelector('.help-flow')).toBeTruthy();
    expect(el.querySelector('#help-pdf')).toBeTruthy();
    expect(el.querySelector('.help-pdf-grid')).toBeTruthy();
  });
});

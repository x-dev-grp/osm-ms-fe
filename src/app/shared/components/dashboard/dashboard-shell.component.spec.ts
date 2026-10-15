import { PortalModule } from '@angular/cdk/portal';
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardExportService } from './dashboard-export.service';
import { DashboardHeaderHost } from './dashboard-header-host.service';
import { DashboardShellComponent } from './dashboard-shell.component';

@Component({
  standalone: true,
  imports: [DashboardShellComponent],
  template: `
    <app-dashboard-shell titleKey="TITLE" icon="spa" [lastUpdated]="lastUpdated">
      <button dashboardHeaderActions class="custom-action" type="button">Action</button>
      <p class="body">Body</p>
    </app-dashboard-shell>
  `
})
class StandaloneHostComponent {
  lastUpdated = new Date(2026, 0, 1);
}

@Component({
  standalone: true,
  imports: [DashboardShellComponent, PortalModule],
  providers: [DashboardHeaderHost],
  template: `
    <div class="outer-header"><ng-template [cdkPortalOutlet]="headerHost.portal()"></ng-template></div>
    @if (showShell()) {
      <app-dashboard-shell titleKey="TITLE" icon="spa" [lastUpdated]="lastUpdated">
        <button dashboardHeaderActions class="custom-action" type="button">Action</button>
        <p class="body">Body</p>
      </app-dashboard-shell>
    }
  `
})
class EmbeddingHostComponent {
  readonly headerHost = inject(DashboardHeaderHost);
  readonly showShell = signal(true);
  lastUpdated = new Date(2026, 0, 1);
}

describe('DashboardShellComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [{ provide: DashboardExportService, useValue: { export: () => Promise.resolve() } }]
    });
  });

  it('renders its own header card when used standalone', () => {
    const fixture = TestBed.createComponent(StandaloneHostComponent);
    fixture.detectChanges();
    const card: HTMLElement | null = fixture.nativeElement.querySelector('.dashboard-header-card');

    expect(card).not.toBeNull();
    expect(card!.querySelector('[data-tour="dash-refresh"]')).not.toBeNull();
    expect(card!.querySelector('.custom-action')).not.toBeNull();
    expect(card!.querySelector('.dashboard-header-card__updated')).not.toBeNull();
  });

  it('hands its toolbar to the header host when embedded', () => {
    const fixture = TestBed.createComponent(EmbeddingHostComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const outer = root.querySelector('.outer-header')!;

    expect(root.querySelector('.dashboard-header-card')).toBeNull();
    expect(outer.querySelector('[data-tour="dash-refresh"]')).not.toBeNull();
    expect(outer.querySelector('.custom-action')).not.toBeNull();
    expect(outer.querySelector('.dashboard-header-card__updated--inline')).not.toBeNull();
    expect(root.querySelector('.body')).not.toBeNull();
  });

  it('clears the header host when the embedded shell is destroyed', () => {
    const fixture = TestBed.createComponent(EmbeddingHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.showShell.set(false);
    fixture.detectChanges();

    expect(fixture.componentInstance.headerHost.portal()).toBeNull();
    expect(fixture.nativeElement.querySelector('.outer-header [data-tour="dash-refresh"]')).toBeNull();
  });
});

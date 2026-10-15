import { ElementRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { GeneralConfigComponent } from './general-config.component';

describe('GeneralConfigComponent', () => {
  function create(tab?: string) {
    const activeTab = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
    const host = { querySelector: jasmine.createSpy('querySelector').and.returnValue(activeTab) } as any;
    const route = { queryParamMap: of(convertToParamMap(tab ? { tab } : {})) } as any;
    return {
      component: new GeneralConfigComponent(route, new ElementRef(host)),
      host,
      activeTab
    };
  }

  it('selects a tab from its stable query key', () => {
    const { component } = create('notifications');
    component.ngOnInit();
    expect(component.selectedTabIndex).toBe(7);
    expect(component.activeTab).toBe('notifications');
  });

  it('maps tab changes by index without depending on translated labels', fakeAsync(() => {
    const { component } = create();
    component.onTabChange({ index: 2, tab: { textLabel: 'مالية' } } as any);
    tick();
    expect(component.activeTab).toBe('finance');
    expect(component.selectedTabIndex).toBe(2);
  }));

  it('reveals the active tab after view initialization', fakeAsync(() => {
    const { component, host, activeTab } = create();
    component.ngAfterViewInit();
    tick();
    expect(host.querySelector).toHaveBeenCalledWith('.mat-mdc-tab.mdc-tab--active');
    expect(activeTab.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }));
});

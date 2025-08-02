import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOilContainerComponent } from './view-oil-container.component';

describe('ViewOilContainerComponent', () => {
  let component: ViewOilContainerComponent;
  let fixture: ComponentFixture<ViewOilContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewOilContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewOilContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

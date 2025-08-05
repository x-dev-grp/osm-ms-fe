import {ComponentFixture, TestBed} from '@angular/core/testing';

import {WasteViewComponent} from './waste-view.component';

describe('WasteViewComponent', () => {
  let component: WasteViewComponent;
  let fixture: ComponentFixture<WasteViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WasteViewComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(WasteViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

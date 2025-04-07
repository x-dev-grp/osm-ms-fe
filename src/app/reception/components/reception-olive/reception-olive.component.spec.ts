import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionOliveComponent } from './reception-olive.component';

describe('ReceptionOliveComponent', () => {
  let component: ReceptionOliveComponent;
  let fixture: ComponentFixture<ReceptionOliveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionOliveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceptionOliveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

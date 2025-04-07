import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionhuileComponent } from './receptionhuile.component';

describe('ReceptionhuileComponent', () => {
  let component: ReceptionhuileComponent;
  let fixture: ComponentFixture<ReceptionhuileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionhuileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceptionhuileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

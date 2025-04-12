import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsReceptionComponent } from './details-reception.component';

describe('DetailsReceptionComponent', () => {
  let component: DetailsReceptionComponent;
  let fixture: ComponentFixture<DetailsReceptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsReceptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsReceptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

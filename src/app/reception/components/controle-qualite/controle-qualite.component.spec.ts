import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControleQualiteComponent } from './controle-qualite.component';

describe('ControleQualiteComponent', () => {
  let component: ControleQualiteComponent;
  let fixture: ComponentFixture<ControleQualiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControleQualiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControleQualiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

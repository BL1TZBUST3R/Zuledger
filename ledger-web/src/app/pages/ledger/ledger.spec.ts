import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerComponent } from './ledger';

describe('LedgerComponent', () => {
  let component: LedgerComponent;
  let fixture: ComponentFixture<LedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

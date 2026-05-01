import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalEntryComponent } from './journal-entry';

describe('JournalEntryComponent', () => {
  let component: JournalEntryComponent;
  let fixture: ComponentFixture<JournalEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JournalEntryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

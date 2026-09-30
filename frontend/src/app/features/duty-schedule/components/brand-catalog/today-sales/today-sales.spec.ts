import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodaySales } from './today-sales';

describe('TodaySales', () => {
  let component: TodaySales;
  let fixture: ComponentFixture<TodaySales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodaySales],
    }).compileComponents();

    fixture = TestBed.createComponent(TodaySales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleChart } from './schedule-chart';

describe('ScheduleChart', () => {
  let component: ScheduleChart;
  let fixture: ComponentFixture<ScheduleChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleChart],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

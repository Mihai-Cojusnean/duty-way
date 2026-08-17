import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ScheduleFinderComponent } from '../components/schedule-finder/schedule-finder.component';
import { BrandCatalogComponent } from '../components/brand-catalog/brand-catalog.component';
import { ScheduleStore } from '../data-access/schedule.store';

@Component({
  selector: 'app-duty-schedule-page',
  standalone: true,
  imports: [ScheduleFinderComponent, BrandCatalogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './duty-schedule-page.component.html',
  styleUrl: './duty-schedule-page.component.css',
})
export class DutySchedulePageComponent {
  protected readonly store = inject(ScheduleStore);
}

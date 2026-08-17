import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DutySchedulePageComponent } from './features/duty-schedule/containers/duty-schedule-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DutySchedulePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}

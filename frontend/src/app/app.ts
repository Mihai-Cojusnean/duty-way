import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DutySchedulePageComponent } from './features/duty-schedule/containers/duty-schedule-page.component';
import { UserService } from './services/user.service';
import { User } from './features/duty-schedule/interfaces/user.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DutySchedulePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  user?: User;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
    } else {
      console.warn('Running outside Telegram');
    }

    this.userService.getUser().subscribe({
      next: (user) => (this.user = user),
      error: (err) => console.error('Failed to load user', err),
    });
  }
}

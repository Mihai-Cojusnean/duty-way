import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { DutySchedulePageComponent } from './features/duty-schedule/containers/duty-schedule-page.component';
import { UserService } from './services/user.service';
import { User } from './features/duty-schedule/interfaces/user.interface';
import { ApiService, AppRole } from './core/api.service';

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
  role: AppRole | null = null;

  constructor(
    private userService: UserService,
    private apiService: ApiService,
    private changeDetector: ChangeDetectorRef,
  ) {}

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

    void this.apiService
      .getCurrentUser()
      .then((currentUser) => {
        this.role = currentUser.role;
        this.changeDetector.markForCheck();
      })
      .catch((error: unknown) => {
        console.error('Failed to verify app role', error);
      });
  }
}

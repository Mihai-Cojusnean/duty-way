import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppRole, User } from './features/duty-schedule/interfaces/user.interface';
import { ApiService } from './core/api.service';
import { UserService } from './core/user.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
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
        this.changeDetector.markForCheck();
      })
      .catch((error: unknown) => {
        console.error('Failed to verify app role', error);
      });
  }
}

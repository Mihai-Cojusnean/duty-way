import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from './features/duty-schedule/interfaces/user.interface';
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

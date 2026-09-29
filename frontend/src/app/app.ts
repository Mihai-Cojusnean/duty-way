import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from './features/duty-schedule/interfaces/user.interface';
import { UserService } from './core/user.service';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';

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

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
    } else {
      console.warn('Running outside Telegram');
    }

    this.apiService.getCurrentUser().then(
      (user) => (this.user = user),
      (err) => console.error('Failed to load user', err),
    );
  }
}

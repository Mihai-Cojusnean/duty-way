import { Component, OnInit } from '@angular/core';
import { TelegramService } from './core/telegram.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html'
})
export class App implements OnInit {

  username = '';

  constructor(private telegramService: TelegramService) {}

  ngOnInit(): void {
    this.telegramService.init();

    const user = this.telegramService.getUser();

    if (user) {
      this.username = user.username
        ? `@${user.username}`
        : user.first_name;
    }
  }
}

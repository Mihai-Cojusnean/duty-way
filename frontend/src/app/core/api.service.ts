import { Injectable } from '@angular/core';
import { TelegramService } from './telegram.service';
import { CurrentUser } from '../features/duty-schedule/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev';

  constructor(private readonly telegramService: TelegramService) {}

  async getCurrentUser(): Promise<CurrentUser> {
  //   const initData = this.telegramService.getInitData();
  //
  //   if (!initData) {
  //     throw new Error('Open Duty Way from Telegram to authenticate.');
  //   }
  //
  //   const response = await fetch(`${this.apiUrl}/api/me`, {
  //     headers: {
  //       'X-Telegram-Init-Data': initData,
  //     },
  //   });
  //
  //   if (!response.ok) {
  //     throw new Error('Could not verify your Telegram account.');
  //   }
  //
  //   return (await response.json()) as CurrentUser;

    return {
      id: '972344705',
      username: 'Mihail Cojusnean',
      language_code: 'en',
      work_name: 'Mihail Cojusnean',
      role: 'admin',
    };
  }
}

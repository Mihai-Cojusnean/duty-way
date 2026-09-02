import { Injectable } from '@angular/core';
import { TelegramService } from './telegram.service';

export type AppRole = 'admin' | 'user';

export interface CurrentUser {
  readonly telegramUser: {
    readonly id: number;
    readonly username?: string;
    readonly language_code?: string;
  };
  readonly role: AppRole;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev';

  constructor(private readonly telegramService: TelegramService) {}

  async getCurrentUser(): Promise<CurrentUser> {
    const initData = this.telegramService.getInitData();

    if (!initData) {
      throw new Error('Open Duty Way from Telegram to authenticate.');
    }

    const response = await fetch(`${this.apiUrl}/api/me`, {
      headers: {
        'X-Telegram-Init-Data': initData,
      },
    });

    if (!response.ok) {
      throw new Error('Could not verify your Telegram account.');
    }

    return (await response.json()) as CurrentUser;
  }
}

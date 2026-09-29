import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { DailySalesSummary } from '../features/duty-schedule/interfaces/duty.interface';
import { TelegramService } from './telegram.service';
import { User } from '../features/duty-schedule/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev';

  constructor(
    private readonly http: HttpClient,
    private readonly telegramService: TelegramService,
  ) {}

  getUsers(): Observable<readonly User[]> {
    return this.http
      .get<{ readonly users: readonly User[] }>(`${this.apiUrl}/api/admin/users`, {
        headers: this.authHeaders,
      })
      .pipe(map((response) => response.users));
  }

  getUserSchedule(telegramUserId: string): Observable<User> {
    console.log(telegramUserId);
    return this.http.get<User>(`${this.apiUrl}/api/admin/users/${telegramUserId}/schedule`, {
      headers: this.authHeaders,
    });
  }

  getUserSalesHistory(
    telegramUserId: string,
    days = 7,
  ): Observable<{ days: readonly DailySalesSummary[] }> {
    return this.http.get<{ days: readonly DailySalesSummary[] }>(
      `${this.apiUrl}/api/admin/users/${telegramUserId}/sales/history?days=${days}`,
      { headers: this.authHeaders },
    );
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Telegram-Init-Data': this.telegramService.getInitData(),
    });
  }
}

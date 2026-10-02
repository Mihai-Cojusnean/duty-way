import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TelegramService } from './telegram.service';
import { User } from '../features/duty-schedule/interfaces/user.interface';
import { Sale, SalesHistoryEntry } from '../features/duty-schedule/interfaces/duty.interface';

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
    return this.http.get<User>(`${this.apiUrl}/api/admin/users/${telegramUserId}/schedule`, {
      headers: this.authHeaders,
    });
  }

  getUserSalesToday(telegramUserId: string): Observable<Sale[]> {
    return this.http
      .get<Sale[]>(`${this.apiUrl}/api/admin/users/${telegramUserId}/sales/today`, {
        headers: this.authHeaders,
      })
      .pipe(map((sales) => sales.map((sale) => ({ ...sale, soldAt: new Date(sale.soldAt) }))));
  }

  getUserSalesHistory(telegramUserId: string, days = 7): Observable<readonly SalesHistoryEntry[]> {
    const params = new HttpParams().set('days', String(days));

    return this.http
      .get<{ readonly days: readonly SalesHistoryEntry[] }>(
        `${this.apiUrl}/api/admin/users/${telegramUserId}/sales/history`,
        { headers: this.authHeaders, params },
      )
      .pipe(map((response) => response.days));
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Telegram-Init-Data': this.telegramService.getInitData(),
    });
  }
}

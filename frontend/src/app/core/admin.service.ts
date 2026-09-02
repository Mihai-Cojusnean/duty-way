import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ScheduleRecord } from '../features/duty-schedule/interfaces/duty.interface';
import { TelegramService } from './telegram.service';

export interface AdminUser {
  readonly telegram_user_id: string;
  readonly work_name: string;
  readonly role: 'admin' | 'user';
}

export interface AdminScheduleResponse {
  readonly user: AdminUser;
  readonly shifts: readonly ScheduleRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev';

  constructor(
    private readonly http: HttpClient,
    private readonly telegramService: TelegramService,
  ) {}

  getUsers(): Observable<readonly AdminUser[]> {
    return this.http
      .get<{ readonly users: readonly AdminUser[] }>(`${this.apiUrl}/api/admin/users`, {
        headers: this.authHeaders,
      })
      .pipe(map((response) => response.users));
  }

  getUserSchedule(telegramUserId: string): Observable<AdminScheduleResponse> {
    return this.http.get<AdminScheduleResponse>(
      `${this.apiUrl}/api/admin/users/${telegramUserId}/schedule`,
      { headers: this.authHeaders },
    );
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Telegram-Init-Data': this.telegramService.getInitData(),
    });
  }
}

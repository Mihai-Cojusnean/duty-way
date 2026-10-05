import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ScheduleRecord } from '../features/duty-schedule/interfaces/duty.interface';
import { User } from '../features/duty-schedule/interfaces/user.interface';
import { TelegramService } from './telegram.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev/api/user';

  constructor(
    private readonly http: HttpClient,
    private readonly telegramService: TelegramService,
  ) {}

  getUserSchedule(): Observable<User> {
    return this.http.get<User>(this.apiUrl, { headers: this.authHeaders });
  }

  saveSchedule(shifts: readonly ScheduleRecord[]): Observable<unknown> {
    return this.http.post(this.apiUrl, { shifts }, { headers: this.authHeaders });
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-Telegram-Init-Data': this.telegramService.getInitData() });
  }
}

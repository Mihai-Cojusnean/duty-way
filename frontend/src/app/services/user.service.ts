import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../features/duty-schedule/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public user: User | undefined;
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev/api/user';

  constructor(private http: HttpClient) {}

  private get authHeaders(): HttpHeaders {
    const initData = window.Telegram?.WebApp?.initData ?? '';

    return new HttpHeaders({
      'X-Telegram-Init-Data': initData,
    });
  }

  getUser(): Observable<User> {
    return this.http.get<User>(this.apiUrl, { headers: this.authHeaders }).pipe(
      tap((userData: User) => {
        this.user = userData;
      }),
    );
  }

  saveUser(shifts: readonly unknown[]): Observable<unknown> {
    return this.http.post(this.apiUrl, { shifts }, { headers: this.authHeaders });
  }
}

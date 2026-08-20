import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../features/duty-schedule/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://duty-way-api.duty-way.workers.dev/api/user';
  public user: User | undefined;

  constructor(private http: HttpClient) {}

  private get telegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
  }

  getUser(): Observable<User> {
    let telegramId = this.telegramUser?.id;
    if (!telegramId) {
      telegramId = 972344705;
    }

    return this.http.get<User>(`${this.apiUrl}?telegramId=${telegramId}`).pipe(
      tap((userData: User) => {
        this.user = userData;
      }),
    );
  }

  saveUser(
    shifts: any[],
    buttonClicked: string = 'aa',
    textWritten: string = 'asd',
  ): Observable<any> {
    const user = this.telegramUser;

    const payload = {
      telegramId: user?.id || '12345678',
      username: user?.username || 'testuser',
      language: user?.language_code || 'en',
      buttonClicked,
      textWritten,
      shifts,
    };

    return this.http.post(this.apiUrl, payload);
  }
}

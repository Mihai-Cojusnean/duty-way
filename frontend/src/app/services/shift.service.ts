import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  // Replace with your actual live URL
  private apiUrl = 'https://duty-way-api.duty-way.workers.dev/api/user';

  constructor(private http: HttpClient) {}

  // Get Telegram WebApp user object safely
  private get telegramUser() {
    return (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  }

  // Load saved data when the Mini App opens
  getUserData(): Observable<any> {
    console.log(this.telegramUser);
    const telegramId = this.telegramUser?.id || '12345678'; // Fallback ID for browser dev
    return this.http.get(`${this.apiUrl}?telegramId=${telegramId}`);
  }

  // Save shifts & metadata to Cloudflare KV
  saveUserData(
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

    console.log(JSON.stringify(payload));
    return this.http.post(this.apiUrl, payload);
  }
}

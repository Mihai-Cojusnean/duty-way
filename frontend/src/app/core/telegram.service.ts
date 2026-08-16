import { Injectable } from '@angular/core';
import WebApp from '@twa-dev/sdk';

@Injectable({
  providedIn: 'root'
})
export class TelegramService {

  init(): void {
    WebApp.ready();
    WebApp.expand();
  }

  getUser() {
    return WebApp.initDataUnsafe?.user;
  }

  getInitData(): string {
    return WebApp.initData;
  }
}

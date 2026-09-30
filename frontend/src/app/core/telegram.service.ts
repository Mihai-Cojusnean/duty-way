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

  getInitData(): string {
    return WebApp.initData;
  }
}

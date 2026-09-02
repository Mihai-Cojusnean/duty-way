import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PerfumeSale } from '../features/duty-schedule/interfaces/duty.interface';
import { TelegramService } from './telegram.service';

export interface SalesSummary {
  readonly count: number;
  readonly totalCents: number;
  readonly currency: 'EUR';
}

export interface SalesHistoryEntry {
  readonly date: string;
  readonly count: number;
  readonly totalCents: number;
  readonly currency: 'EUR';
}

export interface RecordSaleResponse {
  readonly id: string;
  readonly summary: SalesSummary;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly apiUrl = 'https://duty-way-api.duty-way.workers.dev';

  constructor(
    private readonly http: HttpClient,
    private readonly telegramService: TelegramService,
  ) {}

  recordSale(brand: string, sale: PerfumeSale): Observable<RecordSaleResponse> {
    return this.http.post<RecordSaleResponse>(
      `${this.apiUrl}/api/sales`,
      {
        brand,
        perfumeId: sale.perfume.id,
        perfumeName: sale.perfume.name,
        priceLabel: sale.price.label,
        amountCents: sale.price.amountCents,
        currency: sale.price.currency,
      },
      { headers: this.authHeaders },
    );
  }

  getTodaySummary(brand?: string): Observable<SalesSummary> {
    const params = brand ? new HttpParams().set('brand', brand) : undefined;

    return this.http.get<SalesSummary>(`${this.apiUrl}/api/sales/summary`, {
      headers: this.authHeaders,
      params,
    });
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Telegram-Init-Data': this.telegramService.getInitData(),
    });
  }

  getRecentHistory(days = 7): Observable<readonly SalesHistoryEntry[]> {
    const params = new HttpParams().set('days', String(days));

    return this.http
      .get<{ readonly days: readonly SalesHistoryEntry[] }>(`${this.apiUrl}/api/sales/history`, {
        headers: this.authHeaders,
        params,
      })
      .pipe(map((response) => response.days));
  }
}

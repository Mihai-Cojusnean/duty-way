import { computed, inject, Injectable, signal } from '@angular/core';
import { SalesService } from '../../../core/sales.service';
import { PerfumeSale, Sale, SalesHistoryEntry } from '../interfaces/duty.interface';

@Injectable({ providedIn: 'root' })
export class SalesStore {
  private readonly salesService = inject(SalesService);

  readonly todaySales = signal<readonly Sale[]>([]);
  readonly salesHistory = signal<readonly SalesHistoryEntry[]>([]);

  readonly soldTodayCount = computed(() => this.todaySales().length);
  readonly todaySalesTotalCents = computed(() =>
    this.todaySales().reduce((total, sale) => total + sale.price.amountCents, 0),
  );

  constructor() {
    this.loadTodaySales();
    this.loadSalesHistory();
  }

  recordSale(sale: PerfumeSale): void {
    this.salesService.recordSale(sale).subscribe({
      next: (response) => {
        this.loadTodaySales();
      },
      error: (error: unknown) => {
        console.error('Failed to save sale', error);
      },
    });
  }

  loadTodaySales(): void {
    this.salesService.getTodaySales().subscribe({
      next: (sales) => this.todaySales.set(sales),
      error: (error: unknown) => {
        console.error('Failed to load today sales', error);
      },
    });
  }

  loadSalesHistory(): void {
    this.salesService.getRecentHistory(31).subscribe({
      next: (history) => {
        this.salesHistory.set(history);
      },
      error: (error: unknown) => {
        console.error('Failed to load sales history', error);
      },
    });
  }

  removeSale(saleId: string): void {
    const previous = this.todaySales();
    this.todaySales.set(previous.filter((sale) => sale.id !== saleId));

    this.salesService.deleteSale(saleId).subscribe({
      error: (error: unknown) => {
        console.error('Failed to remove sale', error);
        this.todaySales.set(previous);
      },
    });
  }

  // todaySales(): Sale[] {}
}

import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { SalesStore } from '../../../services/sales.store';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-today-sales',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './today-sales.html',
  styleUrl: './today-sales.css',
})
export class TodaySales {
  private readonly salesStore = inject(SalesStore);

  @Output()
  readonly close = new EventEmitter<void>();

  protected readonly todaySales = this.salesStore.todaySales;

  protected readonly todayTotalCents = computed(() =>
    this.todaySales().reduce((total, sale) => total + sale.price.amountCents, 0),
  );

  protected removeSale(saleId: string): void {
    this.salesStore.removeSale(saleId);
  }

  protected closeSales(): void {
    this.close.emit();
  }
}

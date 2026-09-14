import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { Perfume, PerfumePrice, PerfumeSale } from '../../interfaces/duty.interface';
import { PerfumeModalComponent } from '../perfume-modal/perfume-modal.component';

@Component({
  selector: 'app-brand-catalog',
  standalone: true,
  imports: [PerfumeModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-catalog.component.html',
  styleUrl: './brand-catalog.component.css',
})
export class BrandCatalogComponent {
  readonly brandName = input.required<string>();
  readonly perfumes = input.required<Perfume[]>();
  readonly soldCount = input<number>(0);
  readonly todaySales = input<number>(0);
  readonly selectedPrice = signal<PerfumePrice | null>(null);
  readonly backToSchedule = output<void>();
  readonly recordSale = output<PerfumeSale>();

  readonly searchQuery = signal<string>('');
  readonly selectedPerfume = signal<Perfume | null>(null);

  readonly filteredPerfumes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.perfumes();

    return this.perfumes().filter((p) =>
      `${p.name} ${p.creator} ${p.notes}`.toLowerCase().includes(query),
    );
  });

  readonly expandedCollection = signal<string | null>(null);
  readonly expandedPerfumeId = signal<string | number | null>(null);

  readonly collections = computed(() => {
    const perfumesList = this.filteredPerfumes();
    const grouped = new Map<string, Perfume[]>();

    for (const p of perfumesList) {
      const key = p.collection || this.brandName();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    }

    return Array.from(grouped.entries()).map(([name, perfumes]) => ({
      name,
      perfumes,
    }));
  });

  toggleCollection(name: string): void {
    this.expandedCollection.update((curr) => (curr === name ? null : name));
    this.expandedPerfumeId.set(null);
  }

  togglePerfume(id: string | number): void {
    this.expandedPerfumeId.update((current) => (current === id ? null : id));
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getCardImage(url?: string): string | null {
    return url ? `url(${url})` : null;
  }

  priceSummary(perfume: Perfume): string {
    return perfume.prices
      .map(
        (price) =>
          `${price.label} · ${new Intl.NumberFormat('en-IE', {
            style: 'currency',
            currency: price.currency,
          }).format(price.amountCents / 100)}`,
      )
      .join(' | ');
  }

  selectPrice(price: PerfumePrice): void {
    this.selectedPrice.set(price);
  }

  addSale(perfume: any, price: PerfumePrice): void {
    if (!perfume) {
      return;
    }

    this.recordSale.emit({ perfume, price });
  }

  formatPrice(price: PerfumePrice): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: price.currency,
    }).format(price.amountCents / 100);
  }

  formatEuro(amountCents: number): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountCents / 100);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Perfume, PerfumePrice } from '../../interfaces/duty.interface';
import { PerfumeModalComponent } from '../perfume-modal/perfume-modal.component';
import { CatalogService } from '../../services/catalog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SalesStore } from '../../services/sales.store';
import { CurrencyPipe } from '@angular/common';
import { TodaySales } from './today-sales/today-sales';

@Component({
  selector: 'app-brand-catalog',
  standalone: true,
  imports: [PerfumeModalComponent, CurrencyPipe, TodaySales],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-catalog.component.html',
  styleUrl: './brand-catalog.component.css',
})
export class BrandCatalogComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly salesStore = inject(SalesStore);

  protected readonly salesOpen = signal(false);
  readonly soldTodayCount = this.salesStore.soldTodayCount;
  readonly todaySalesTotalCents = this.salesStore.todaySalesTotalCents;
  readonly selectedPerfume = signal<Perfume | null>(null);
  readonly searchQuery = signal<string>('');
  readonly addedSale = signal<string | null>(null);

  protected readonly brandName = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('brand')?.trim() ?? '')),
    { initialValue: '' },
  );

  protected openPerfume(perfume: Perfume): void {
    this.selectedPerfume.set(perfume);
  }

  readonly catalog = resource<Perfume[], { brand: string } | undefined>({
    params: () => {
      const brand = this.brandName().trim();
      return brand ? { brand } : undefined;
    },
    defaultValue: [],
    loader: ({ params }) => this.catalogService.getBrandCatalog(params.brand),
  });

  private readonly catalogPerfumes = computed(() =>
    this.catalog.hasValue() ? this.catalog.value() : [],
  );

  readonly filteredPerfumes = computed(() => {
    const perfumes = this.catalog.value() ?? [];
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return perfumes;

    return perfumes.filter((p) =>
      `${p.name} ${p.creator} ${p.notes}`.toLowerCase().includes(query),
    );
  });

  readonly expandedCollection = signal<string | null>(null);

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
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  addSale(perfume: Perfume, price: PerfumePrice): void {
    this.salesStore.recordSale({
      perfume,
      price,
      brand: perfume.id,
    });

    const key = `${perfume.id}-${price.label}`;
    this.addedSale.set(key);

    setTimeout(() => {
      if (this.addedSale() === key) {
        this.addedSale.set(null);
      }
    }, 1000);
  }

  protected openSales(): void {
    this.salesOpen.set(true);
  }

  protected closeSales(): void {
    this.salesOpen.set(false);
  }

  goBack(): void {
    this.router.navigate(['/']).then((r) => console.log(r));
  }
}

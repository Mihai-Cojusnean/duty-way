import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { Perfume } from '../../interfaces/duty.interface';
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

  readonly backToSchedule = output<void>();
  readonly recordSale = output<Perfume>();

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

  // Group perfumes by collection/category dynamically
  readonly collections = computed(() => {
    const perfumesList = this.filteredPerfumes();
    const grouped = new Map<string, Perfume[]>();

    for (const p of perfumesList) {
      // Falls back to brandName if collection field isn't defined
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
    this.expandedPerfumeId.set(null); // Reset child selection when toggling collection
  }

  // Add this toggle method:
  togglePerfume(id: string | number): void {
    this.expandedPerfumeId.update((current) => (current === id ? null : id));
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSaleAdded(perfume: Perfume): void {
    this.recordSale.emit(perfume);
    this.selectedPerfume.set(null);
  }

  getCardBg(url?: string): string {
    return url ? `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.75)), url(${url})` : 'none';
  }
}

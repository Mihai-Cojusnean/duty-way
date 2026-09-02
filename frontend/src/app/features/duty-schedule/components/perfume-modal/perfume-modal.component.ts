import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Perfume, PerfumePrice } from '../../interfaces/duty.interface';

@Component({
  selector: 'app-perfume-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfume-modal.component.html',
  styleUrl: './perfume-modal.component.css',
})
export class PerfumeModalComponent {
  readonly perfume = input.required<Perfume>();
  readonly close = output<void>();
  readonly addSale = output<PerfumePrice>();
  readonly selectedPrice = signal<PerfumePrice | null>(null);

  readonly fragranceNotes = computed(() =>
    this.perfume().notes
      ? this.perfume()
          .notes.split(',')
          .map((note) => note.trim())
      : [],
  );

  readonly bgOverlayStyle = computed(() => {
    const url = this.perfume().imageUrl;
    return url ? `url("${url}")` : 'none';
  });

  selectPrice(price: PerfumePrice): void {
    this.selectedPrice.set(price);
  }

  addSelectedSale(): void {
    const price = this.selectedPrice();

    if (price) {
      this.addSale.emit(price);
    }
  }

  formatPrice(price: PerfumePrice): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: price.currency,
    }).format(price.amountCents / 100);
  }
}

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
}

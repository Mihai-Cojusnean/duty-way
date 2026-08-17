import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Perfume } from '../../models/duty.models';

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
  readonly addSale = output<Perfume>();

  readonly fragranceNotes = computed(() =>
    this.perfume().notes
      ? this.perfume()
          .notes.split(',')
          .map((note) => note.trim())
      : [],
  );

  readonly bgOverlayStyle = computed(() => {
    const url = this.perfume().imageUrl;
    return url
      ? `linear-gradient(rgba(10, 10, 25, 0.88), rgba(10, 10, 25, 0.94)), url(${url})`
      : 'none';
  });
}

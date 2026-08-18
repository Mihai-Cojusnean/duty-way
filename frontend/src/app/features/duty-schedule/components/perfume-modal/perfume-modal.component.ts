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
    return url ? `url("${url}")` : 'none';
  });
}

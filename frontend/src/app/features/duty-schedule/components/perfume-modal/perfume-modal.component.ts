import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Perfume } from '../../interfaces/duty.interface';

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

  readonly fragranceNotes = computed(() =>
    this.perfume().notes
      ? this.perfume()
          .notes.split(',')
          .map((note) => note.trim())
      : [],
  );
}

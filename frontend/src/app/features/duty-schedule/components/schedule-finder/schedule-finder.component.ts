import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { ScheduleRecord } from '../../models/duty.models';

@Component({
  selector: 'app-schedule-finder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-finder.component.html',
  styleUrl: './schedule-finder.component.css',
})
export class ScheduleFinderComponent {
  readonly username = input<string>();
  readonly message = input<string>();
  readonly records = input.required<ScheduleRecord[]>();
  readonly personName = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly nameChanged = output<string>();
  readonly submitSearch = output<void>();
  readonly isSubmitDisabled = computed(() => !this.personName().trim() || !this.selectedFile());
  readonly pastShifts = computed(() => this.records().filter((r) => r.isPast));
  readonly upcomingShifts = computed(() => this.records().filter((r) => !r.isPast));
  onNameInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.personName.set(val);
    this.nameChanged.emit(val);
  }
  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file) {
      this.selectedFile.set(file);
      this.fileSelected.emit(file);
    }
  }
}

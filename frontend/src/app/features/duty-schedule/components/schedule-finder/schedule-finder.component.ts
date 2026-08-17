import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { ScheduleRecord } from "../../models/duty.models";

interface ScheduleDay {
  readonly id: string;
  readonly day: string;
  readonly dateStr: string;
  readonly isToday: boolean;
  readonly shifts: readonly ScheduleRecord[];
}

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

  readonly pastDays = computed(() =>
    this.groupByDay(this.records().filter((record) => record.isPast)),
  );

  readonly upcomingDays = computed(() =>
    this.groupByDay(this.records().filter((record) => !record.isPast)),
  );

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

  private groupByDay(records: readonly ScheduleRecord[]): readonly ScheduleDay[] {
    const days = new Map<string, ScheduleDay>();

    for (const record of records) {
      const existing = days.get(record.dateStr);

      if (existing) {
        days.set(record.dateStr, {
          ...existing,
          shifts: [...existing.shifts, record],
        });
        continue;
      }

      days.set(record.dateStr, {
        id: record.dateStr,
        day: record.day,
        dateStr: record.dateStr,
        isToday: record.isToday === true,
        shifts: [record],
      });
    }

    return [...days.values()];
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ScheduleRecord } from '../../models/duty.models';

export interface ShiftGroup {
  date: string;
  shifts: ScheduleRecord[];
  isMultiShift: boolean;
}

function groupRecordsByDate(records: readonly ScheduleRecord[]): ShiftGroup[] {
  const groups = new Map<string, ScheduleRecord[]>();

  for (const record of records) {
    const date = record.dateStr.trim();
    const existing = groups.get(date);

    if (existing) {
      existing.push(record);
    } else {
      groups.set(date, [record]);
    }
  }

  return [...groups].map(([date, shifts]) => ({
    date,
    shifts,
    isMultiShift: shifts.length > 1,
  }));
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

  readonly personName = signal('');
  readonly selectedFile = signal<File | null>(null);

  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly nameChanged = output<string>();
  readonly submitSearch = output<void>();

  readonly isSubmitDisabled = computed(
    () => !this.personName().trim() || this.selectedFile() === null,
  );

  private readonly shiftsByPeriod = computed(() => {
    const past: ScheduleRecord[] = [];
    const upcoming: ScheduleRecord[] = [];

    for (const record of this.records()) {
      (record.isPast ? past : upcoming).push(record);
    }

    return { past, upcoming };
  });

  readonly pastShiftGroups = computed(() => groupRecordsByDate(this.shiftsByPeriod().past));

  readonly upcomingShiftGroups = computed(() => groupRecordsByDate(this.shiftsByPeriod().upcoming));

  readonly totalPastShiftCount = computed(() => this.shiftsByPeriod().past.length);

  onNameInput({ target }: Event): void {
    const name = (target as HTMLInputElement).value;
    this.personName.set(name);
    this.nameChanged.emit(name);
  }

  onFileChange({ target }: Event): void {
    const file = (target as HTMLInputElement).files?.item(0) ?? null;

    this.selectedFile.set(file);

    if (file) {
      this.fileSelected.emit(file);
    }
  }

  shortDay(day: string): string {
    return day.slice(0, 3);
  }
}

import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ScheduleDiff, ScheduleRecord } from '../../interfaces/duty.interface';
import { NgTemplateOutlet } from '@angular/common';
import { SalesHistoryEntry } from '../../../../core/sales.service';

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
  imports: [NgTemplateOutlet],
  templateUrl: './schedule-finder.component.html',
  styleUrl: './schedule-finder.component.css',
})
export class ScheduleFinderComponent {
  readonly message = input<string>();
  readonly records = input.required<ScheduleRecord[]>();
  readonly username = input<string>();

  readonly selectedFile = signal<File | null>(null);
  readonly assignedWorkName = input<string>('');
  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly submitSearch = output<void>();
  readonly scheduleDiff = input<ScheduleDiff | null>(null);
  readonly isSubmitDisabled = computed(
    () => !this.assignedWorkName().trim() || !this.selectedFile(),
  );
  readonly soldTodayCount = input<number>(0);
  readonly todaySalesTotalCents = input<number>(0);
  readonly salesHistory = input<readonly SalesHistoryEntry[]>([]);

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

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);

    if (file) {
      this.fileSelected.emit(file);
    }
  }

  shortDay(day: string): string {
    return day.slice(0, 3);
  }

  formatEuro(amountCents: number): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountCents / 100);
  }

  formatSalesDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${date}T12:00:00`));
  }
}

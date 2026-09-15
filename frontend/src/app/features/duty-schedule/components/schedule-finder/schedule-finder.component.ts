import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ScheduleDiff, ScheduleRecord } from '../../interfaces/duty.interface';
import { NgTemplateOutlet } from '@angular/common';
import { SalesHistoryEntry } from '../../../../core/sales.service';
import { ScheduleChart } from './schedule-chart/schedule-chart';

export interface ShiftGroup {
  date: string;
  shifts: ScheduleRecord[];
  isMultiShift: boolean;
  isDayOff: boolean;
  dayLabel: string;
}

function groupRecordsByDate(
  records: readonly ScheduleRecord[],
  includeDaysOff = false,
): ShiftGroup[] {
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

  const sortedGroups = [...groups.entries()].sort(
    ([, a], [, b]) => a[0].dateNumber - b[0].dateNumber,
  );

  if (records.some((record) => !record.isPast)) {
    const result: ShiftGroup[] = [];

    for (let i = 0; i < sortedGroups.length; i++) {
      const [date, shifts] = sortedGroups[i];

      result.push({
        date,
        shifts,
        isMultiShift: shifts.length > 1,
        isDayOff: false,
        dayLabel: date,
      });

      const next = sortedGroups[i + 1];

      if (!next) {
        continue;
      }

      const currentDate = parseScheduleDate(date);
      const nextDate = parseScheduleDate(next[0]);

      if (includeDaysOff) {
        if (!Number.isNaN(currentDate.getTime()) && !Number.isNaN(nextDate.getTime())) {
          const daysBetween = Math.round((nextDate.getTime() - currentDate.getTime()) / 86_400_000);

          for (let day = 1; day < daysBetween; day++) {
            const dayOff = new Date(currentDate);
            dayOff.setDate(dayOff.getDate() + day);

            result.push({
              date: `day-off-${dayOff.getTime()}`,
              shifts: [],
              isMultiShift: false,
              isDayOff: true,
              dayLabel: formatDayOffLabel(dayOff),
            });
          }
        }
      }
    }

    return result;
  }

  return sortedGroups.map(([date, shifts]) => ({
    date,
    shifts,
    isMultiShift: shifts.length > 1,
    isDayOff: false,
    dayLabel: date,
  }));
}

function parseScheduleDate(dateStr: string): Date {
  const date = new Date(`${dateStr} ${new Date().getFullYear()}`);

  date.setHours(12, 0, 0, 0);

  return date;
}

function formatDayOffLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

@Component({
  selector: 'app-schedule-finder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ScheduleChart],
  templateUrl: './schedule-finder.component.html',
  styleUrl: './schedule-finder.component.css',
})
export class ScheduleFinderComponent {
  readonly message = input<string>();
  readonly records = input.required<ScheduleRecord[]>();
  readonly username = input<string>();

  readonly getBrand = (record: ScheduleRecord) => record.brand;
  readonly getTerminal = (record: ScheduleRecord) => record.tabName;

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
  readonly isReadOnly = input<boolean>(false);

  private readonly shiftsByPeriod = computed(() => {
    const past: ScheduleRecord[] = [];
    const upcoming: ScheduleRecord[] = [];

    for (const record of this.records()) {
      (record.isPast ? past : upcoming).push(record);
    }

    return { past, upcoming };
  });
  readonly pastShiftGroups = computed(() => groupRecordsByDate(this.shiftsByPeriod().past, false));

  readonly upcomingShiftGroups = computed(() =>
    groupRecordsByDate(this.shiftsByPeriod().upcoming, true),
  );
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

  salesForShiftGroup(records: readonly ScheduleRecord[]): SalesHistoryEntry | null {
    const dateStr = records[0]?.dateStr;

    if (!dateStr) {
      return null;
    }

    const date = new Date(`${dateStr} ${new Date().getFullYear()}`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    return this.salesHistory().find((sale) => sale.date === dateKey) ?? null;
  }
}

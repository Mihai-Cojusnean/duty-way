import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import {
  ISODate,
  SalesHistoryEntry,
  ScheduleDiff,
  ScheduleRecord,
} from '../../interfaces/duty.interface';
import { ScheduleChart } from './schedule-chart/schedule-chart';
import { groupRecordsByDate, isPast } from '../../services/schedule.utils';
import { AdminService } from '../../../../core/admin.service';
import { UserService } from '../../../../core/user.service';
import { ScheduleDiffService } from '../../services/schedule-diff.service';
import { ScheduleParserService } from '../../services/schedule-parser.service';
import { SalesStore } from '../../services/sales.store';
import { User, ViewedUser } from '../../interfaces/user.interface';
import { isToday, formatScheduleDate } from '../../services/schedule.utils'

@Component({
  selector: 'app-schedule-finder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ScheduleChart],
  templateUrl: './schedule-finder.component.html',
  styleUrl: './schedule-finder.component.css',
})
export class ScheduleFinderComponent {
  private readonly userService = inject(UserService);
  private readonly adminService = inject(AdminService);
  private readonly scheduleDiffService = inject(ScheduleDiffService);
  private readonly scheduleParserService = inject(ScheduleParserService);
  private readonly salesStore = inject(SalesStore);
  private readonly router = inject(Router);

  readonly statusMessage = signal('');
  readonly records = signal<ScheduleRecord[]>([]);
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly isToday = isToday;
  readonly formatScheduleDate = formatScheduleDate;

  readonly salesHistory = this.salesStore.salesHistory;

  readonly viewedUser = input<ViewedUser | null>(null);
  readonly soldTodayCount = input<number>(0);
  readonly todaySalesTotalCents = input<number>(0);

  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();

  readonly getBrand = (record: ScheduleRecord) => record.brand;
  readonly getTerminal = (record: ScheduleRecord) => record.terminal;

  private readonly shiftsByPeriod = computed(() => {
    const past: ScheduleRecord[] = [];
    const upcoming: ScheduleRecord[] = [];

    for (const record of this.records()) {
      if (isPast(record.date)) {
        past.push(record);
      } else {
        upcoming.push(record);
      }
    }

    return { past, upcoming };
  });

  readonly pastShiftGroups = computed(() =>
    groupRecordsByDate(this.shiftsByPeriod().past, {
      includeDaysOff: false,
    }),
  );

  readonly upcomingShiftGroups = computed(() =>
    groupRecordsByDate(this.shiftsByPeriod().upcoming, {
      includeDaysOff: true,
    }),
  );

  readonly totalPastShiftCount = computed(() => this.shiftsByPeriod().past.length);

  constructor() {
    effect(() => {
      const viewed = this.viewedUser();

      if (viewed) {
        this.loadScheduleFor(viewed);
        this.salesStore.loadSalesHistory();
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);

    if (file) {
      this.loadSchedule();
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

  formatSalesDate(date: ISODate): string {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(this.parseISODate(date));
  }

  salesForShiftGroup(records: readonly ScheduleRecord[]): SalesHistoryEntry | null {
    const date = records[0]?.date;

    if (!date) {
      return null;
    }

    return this.salesHistory().find((sale) => sale.date === date) ?? null;
  }

  private saveSchedule(records: readonly ScheduleRecord[]): void {
    this.userService.saveSchedule([...records]).subscribe({
      next: () => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }

  private loadScheduleFor(viewed: ViewedUser): void {
    const request$: Observable<User> = viewed.isViewingSelf
      ? this.userService.getUserSchedule()
      : this.adminService.getUserSchedule(viewed.user.telegram_id);

    request$.subscribe({
      next: (record) => {
        const records = record.shifts ?? [];

        this.applySchedule(
          records,
          records.length
            ? `${records.length} shifts`
            : `${viewed.user.work_name} has no saved schedule.`,
        );
      },
      error: () => {
        this.statusMessage.set('Could not load this schedule.');
      },
    });
  }

  async loadSchedule(): Promise<void> {
    const file = this.selectedFile();
    const viewed = this.viewedUser();

    if (!file || !viewed) {
      return;
    }

    try {
      const records = await this.scheduleParserService.parse(file, viewed.user.work_name);

      this.applySchedule(
        records,
        records.length
          ? `${records.length} shifts loaded from Excel.`
          : `No shifts found for "${viewed.user.work_name}".`,
      );

      this.saveSchedule(records);
    } catch (error) {
      console.error('Error loading schedule:', error);
      this.statusMessage.set('Could not read the schedule file.');
    }
  }

  goToBrand(brand: string): void {
    this.openBrand.emit(brand);
    this.router.navigate(['/brand-catalog', brand]).catch((error) => {
      console.error('Navigation error:', error);
    });
  }

  private applySchedule(records: readonly ScheduleRecord[], message: string): void {
    const previous = this.records();
    const viewed = this.viewedUser();

    this.records.set([...records]);

    this.scheduleDiff.set(
      viewed?.isViewingSelf && previous.length
        ? this.scheduleDiffService.compare(previous, records)
        : null,
    );

    this.statusMessage.set(message);
  }

  private parseISODate(date: ISODate): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { SalesHistoryEntry, ScheduleDiff, ScheduleRecord } from '../../interfaces/duty.interface';
import { ScheduleChart } from './schedule-chart/schedule-chart';
import {
  formatScheduleDate,
  formatShiftHours,
  groupRecordsByDate,
  isPast,
  isToday,
  shiftKey,
} from '../../services/schedule.utils';
import { AdminService } from '../../../../core/admin.service';
import { UserService } from '../../../../core/user.service';
import { ScheduleDiffService } from '../../services/schedule-diff.service';
import { ScheduleParserService } from '../../services/schedule-parser.service';
import { SalesStore } from '../../services/sales.store';
import { User, ViewedUser } from '../../interfaces/user.interface';

@Component({
  selector: 'app-schedule-finder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScheduleChart],
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
  readonly isToday = isToday;
  readonly formatShiftHours = formatShiftHours;
  readonly formatScheduleDate = formatScheduleDate;
  readonly salesHistory = this.salesStore.salesHistory;
  readonly viewedUser = input<ViewedUser | null>(null);
  readonly totalPastShiftCount = computed(() => this.shiftsByPeriod().past.length);
  readonly selectedShift = signal<ScheduleRecord | null>(null);

  private readonly shiftsByPeriod = computed(() => {
    const past: ScheduleRecord[] = [];
    const upcoming: ScheduleRecord[] = [];

    for (const record of this.records()) {
      isPast(record.date) ? past.push(record) : upcoming.push(record);
    }

    return { past, upcoming };
  });

  readonly pastShiftGroups = computed(() =>
    groupRecordsByDate(this.shiftsByPeriod().past, { includeDaysOff: false }),
  );

  readonly upcomingShiftGroups = computed(() =>
    groupRecordsByDate(this.shiftsByPeriod().upcoming, { includeDaysOff: true }),
  );

  constructor() {
    effect(() => {
      const viewed = this.viewedUser();
      if (viewed) {
        this.loadScheduleFor(viewed);
        this.salesStore.loadSalesHistory(viewed);
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) void this.loadNewSchedule(file);

    input.value = '';
  }

  formatEuro(amountCents: number): string {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountCents / 100);
  }

  private readonly salesByShiftKey = computed(() => {
    const map = new Map<string, SalesHistoryEntry>();
    for (const sale of this.salesHistory()) {
      if (sale.shiftKey) map.set(sale.shiftKey, sale);
    }
    return map;
  });

  salesForShiftGroup(record: ScheduleRecord): SalesHistoryEntry | null {
    return this.salesByShiftKey().get(shiftKey(record)) ?? null;
  }

  private saveSchedule(records: readonly ScheduleRecord[]): void {
    this.userService.saveSchedule([...records]).subscribe({
      error: (err) => console.error('Error saving schedule:', err),
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
          records.length ? '' : `${viewed.user.work_name} has no saved schedule.`,
        );
      },
      error: () => {
        this.statusMessage.set('Could not load this schedule.');
      },
    });
  }

  async loadNewSchedule(file: File): Promise<void> {
    const viewed = this.viewedUser();

    if (!viewed) return;

    try {
      const records = await this.scheduleParserService.parse(file, viewed.user.work_name);

      this.applySchedule(
        records,
        records.length ? '' : `No shifts found for "${viewed.user.work_name}".`,
        true,
      );

      this.saveSchedule(records);
    } catch (error) {
      console.error('Failed to parse schedule file:', error);
      this.statusMessage.set(error instanceof Error ? error.message : String(error));
    }
  }

  private applySchedule(
    records: readonly ScheduleRecord[],
    message: string,
    compareWithPrevious = false,
  ): void {
    const previous = this.records();
    const viewed = this.viewedUser();

    this.records.set([...records]);

    this.scheduleDiff.set(
      compareWithPrevious && viewed?.isViewingSelf && previous.length
        ? this.scheduleDiffService.compare(previous, records)
        : null,
    );

    this.statusMessage.set(message);
  }

  openShift(shift: ScheduleRecord): void {
    this.selectedShift.set(shift);
  }

  closeShift(): void {
    this.selectedShift.set(null);
  }

  goToBrand(brand: string): void {
    this.router.navigate(['/brand-catalog', brand]).catch((error) => {
      console.error('Navigation error:', error);
    });
  }
}

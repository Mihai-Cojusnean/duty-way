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
import { SalesHistoryEntry, ScheduleDiff, ScheduleRecord } from '../../interfaces/duty.interface';
import { NgTemplateOutlet } from '@angular/common';
import { ScheduleChart } from './schedule-chart/schedule-chart';
import { groupRecordsByDate, prepareScheduleRecords } from '../../services/schedule.utils';
import { ViewedUser } from '../../interfaces/user.interface';
import { AdminService } from '../../../../core/admin.service';
import { UserService } from '../../../../core/user.service';
import { ScheduleDiffService } from '../../services/schedule-diff.service';
import { ScheduleParserService } from '../../services/schedule-parser.service';
import { Router } from '@angular/router';
import { SalesStore } from '../../services/sales.store';

export interface ShiftGroup {
  date: string;
  shifts: ScheduleRecord[];
  isMultiShift: boolean;
  isDayOff: boolean;
  dayLabel: string;
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
  private readonly userService = inject(UserService);
  private readonly adminService = inject(AdminService);
  private readonly scheduleDiffService = inject(ScheduleDiffService);
  private readonly scheduleParserService = inject(ScheduleParserService);
  private readonly salesStore = inject(SalesStore);

  readonly statusMessage = signal('');
  readonly records = signal<ScheduleRecord[]>([]);
  readonly user = input<ViewedUser | null>(null);
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);

  private readonly router = inject(Router);
  readonly salesHistory = this.salesStore.salesHistory;

  readonly getBrand = (record: ScheduleRecord) => record.brand;
  readonly getTerminal = (record: ScheduleRecord) => record.tabName;

  readonly selectedFile = signal<File | null>(null);
  readonly assignedWorkName = input<string>('');
  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly submitSearch = output<void>();
  readonly isSubmitDisabled = computed(
    () => !this.assignedWorkName().trim() || !this.selectedFile(),
  );
  readonly soldTodayCount = input<number>(0);
  readonly todaySalesTotalCents = input<number>(0);

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

  constructor() {
    this.salesStore.loadSalesHistory();

    effect(() => {
      const user = this.user();
      if (user) {
        this.loadScheduleFor(user);
      }
    });
  }

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

  private saveSchedule(sorted: ScheduleRecord[]): void {
    this.userService.saveUser(sorted).subscribe({
      next: (res) => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }

  private loadScheduleFor(user: ViewedUser): void {
    this.statusMessage.set(`Loading ${user.work_name}'s schedule...`);

    this.adminService.getUserSchedule(user.telegram_user_id).subscribe({
      next: (response) => {
        const records = prepareScheduleRecords(response.shifts ?? []);
        const previous = this.records();

        this.records.set(records);
        this.scheduleDiff.set(
          previous.length ? this.scheduleDiffService.compare(previous, records) : null,
        );
        this.statusMessage.set(
          records.length ? `${records.length} shifts` : `${user.work_name} has no saved schedule.`,
        );
      },
      error: (error: unknown) => {
        console.error('Failed to load schedule', error);
        this.statusMessage.set('Could not load this schedule.');
      },
    });
  }

  async loadSchedule(): Promise<void> {
    const file = this.selectedFile();
    if (!file || !this.user()) {
      return;
    }

    // @ts-ignore
    const rawRecords = await this.scheduleParserService.parse(file, this.user().work_name);
    const records = prepareScheduleRecords(rawRecords);
    const previousRecords = this.records();

    this.records.set(records);
    this.scheduleDiff.set(
      previousRecords.length ? this.scheduleDiffService.compare(previousRecords, records) : null,
    );
    this.statusMessage.set(
      records.length ? `${records.length} shifts` : `No shifts found for "${name}".`,
    );
    this.saveSchedule(records);
  }

  setFile(file: File): void {
    this.selectedFile.set(file);
    this.statusMessage.set('');
  }

  goToBrand(brand: string): void {
    this.openBrand.emit(brand);
    this.router.navigate(['/brand-catalog', brand]).then((r) => console.log(r));
  }
}

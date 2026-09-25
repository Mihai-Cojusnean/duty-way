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
import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import { ScheduleChart } from './schedule-chart/schedule-chart';
import { groupRecordsByDate, prepareScheduleRecords } from '../../services/schedule.utils';
import { AdminService } from '../../../../core/admin.service';
import { UserService } from '../../../../core/user.service';
import { ScheduleDiffService } from '../../services/schedule-diff.service';
import { ScheduleParserService } from '../../services/schedule-parser.service';
import { Router } from '@angular/router';
import { SalesStore } from '../../services/sales.store';
import { map } from 'rxjs';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-schedule-finder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ScheduleChart, JsonPipe],
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
  readonly user = input<User | null>(null);
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);

  private readonly router = inject(Router);
  readonly salesHistory = this.salesStore.salesHistory;

  readonly getBrand = (record: ScheduleRecord) => record.brand;
  readonly getTerminal = (record: ScheduleRecord) => record.tabName;

  readonly selectedFile = signal<File | null>(null);
  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly isSubmitDisabled = computed(
    () => !this.user()?.work_name?.trim() || !this.selectedFile(),
  );
  readonly soldTodayCount = input<number>(0);
  readonly todaySalesTotalCents = input<number>(0);
  mess = "nothing";

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
    effect(() => {
      const user = this.user();
      if (user) {
        this.loadScheduleFor(user);
        this.salesStore.loadSalesHistory();
      }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);

    if (file) {
      this.loadSchedule().then((r) => console.log(r));
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

  private loadScheduleFor(user: User): void {
    this.mess = `Loading ${user.work_name}'s schedule...`;
    this.statusMessage.set(`Loading ${user.work_name}'s schedule...`);

    const request$ = user.is_admin
      ? this.userService.getUser().pipe(map((record) => ({ shifts: record.shifts ?? [] })))
      : this.adminService
          .getUserSchedule(user.work_name)
          .pipe(map((response) => ({ shifts: response.shifts ?? [] })));

    request$.subscribe({
      next: (response) => {
        const records = prepareScheduleRecords(response.shifts ?? []);
        this.applySchedule(
          records,
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
    this.mess = String(this.user()?.work_name);
    const file = this.selectedFile();
    const user = this.user();

    if (!file || !user) return;

    const rawRecords = await this.scheduleParserService.parse(file, user.work_name);

    const records = prepareScheduleRecords(rawRecords);

    this.applySchedule(
      records,
      records.length
        ? `${records.length} shifts loaded from Excel.`
        : `No shifts found for "${user.work_name}".`,
    );

    this.saveSchedule(records);
  }

  goToBrand(brand: string): void {
    this.openBrand.emit(brand);
    this.router.navigate(['/brand-catalog', brand]).then((r) => console.log(r));
  }

  private applySchedule(records: ScheduleRecord[], message: string): void {
    const previous = this.records();

    this.records.set(records);
    this.scheduleDiff.set(
      previous.length ? this.scheduleDiffService.compare(previous, records) : null,
    );

    this.statusMessage.set(message);
  }
}

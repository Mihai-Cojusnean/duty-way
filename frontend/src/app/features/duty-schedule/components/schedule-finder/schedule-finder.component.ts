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
import { AdminService } from '../../../../core/admin.service';
import { UserService } from '../../../../core/user.service';
import { ScheduleDiffService } from '../../services/schedule-diff.service';
import { ScheduleParserService } from '../../services/schedule-parser.service';
import { Router } from '@angular/router';
import { SalesStore } from '../../services/sales.store';
import { Observable } from 'rxjs';
import { User, ViewedUser } from '../../interfaces/user.interface';

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
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);
  private readonly router = inject(Router);

  readonly salesHistory = this.salesStore.salesHistory;
  readonly getBrand = (record: ScheduleRecord) => record.brand;
  readonly getTerminal = (record: ScheduleRecord) => record.terminal;
  readonly selectedFile = signal<File | null>(null);
  readonly openBrand = output<string>();
  readonly fileSelected = output<File>();
  readonly viewedUser = input<ViewedUser | null>(null);
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
    this.userService.saveSchedule(sorted).subscribe({
      next: (res) => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }

  private loadScheduleFor(viewed: ViewedUser): void {
    const request$: Observable<User> = viewed.isViewingSelf
      ? this.userService.getUserSchedule()
      : this.adminService.getUserSchedule(viewed.user.telegram_id);

    request$.subscribe({
      next: (record) => {
        const records = prepareScheduleRecords(record.shifts ?? []);
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

    if (!file || !viewed) return;

    const rawRecords = await this.scheduleParserService.parse(file, viewed.user.work_name);

    const records = prepareScheduleRecords(rawRecords);

    this.applySchedule(
      records,
      records.length
        ? `${records.length} shifts loaded from Excel.`
        : `No shifts found for "${viewed.user.work_name}".`,
    );

    this.saveSchedule(records);
  }

  goToBrand(brand: string): void {
    this.openBrand.emit(brand);
    this.router.navigate(['/brand-catalog', brand]).then((r) => console.log(r));
  }

  private applySchedule(records: ScheduleRecord[], message: string): void {
    const previous = this.records();
    const viewed = this.viewedUser();

    this.records.set(records);

    this.scheduleDiff.set(
      viewed?.isViewingSelf && previous.length
        ? this.scheduleDiffService.compare(previous, records)
        : null,
    );

    this.statusMessage.set(message);
  }
}

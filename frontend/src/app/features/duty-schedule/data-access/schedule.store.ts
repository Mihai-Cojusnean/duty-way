import { computed, inject, Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';
import { TelegramService } from '../../../core/telegram.service';
import { Perfume, PerfumeSale, ScheduleDiff, ScheduleRecord } from '../interfaces/duty.interface';
import { UserService } from '../../../services/user.service';
import { User } from '../interfaces/user.interface';
import { ApiService, AppRole } from '../../../core/api.service';
import { SalesHistoryEntry, SalesService } from '../../../core/sales.service';
import { AdminService, AdminUser } from '../../../core/admin.service';
import { CatalogService } from '../../../services/catalog.service';

@Injectable({ providedIn: 'root' })
export class ScheduleStore {
  private readonly telegramService = inject(TelegramService);
  private readonly userService = inject(UserService);
  private readonly apiService = inject(ApiService);
  private readonly salesService = inject(SalesService);
  private readonly adminService = inject(AdminService);
  private readonly catalogService = inject(CatalogService);

  readonly username = signal<string>('');
  readonly personName = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly scheduleRecords = signal<ScheduleRecord[]>([]);
  readonly scheduleDiff = signal<ScheduleDiff | null>(null);
  readonly statusMessage = signal<string>('');
  readonly selectedBrand = signal<string | null>(null);
  readonly brandPerfumes = signal<Perfume[]>([]);
  readonly soldTodayCount = signal<number>(0);
  readonly todaySalesTotalCents = signal<number>(0);
  readonly salesHistory = signal<readonly SalesHistoryEntry[]>([]);
  readonly previousSalesHistory = computed(() => {
    const today = new Date().toISOString().slice(0, 10);

    return this.salesHistory().filter((entry) => entry.date !== today);
  });
  readonly appRole = signal<AppRole | null>(null);
  readonly adminUsers = signal<readonly AdminUser[]>([]);
  readonly viewedAdminUser = signal<AdminUser | null>(null);
  readonly isViewingAdminSchedule = computed(() => this.viewedAdminUser() !== null);

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    this.telegramService.init();

    try {
      const currentUser = await this.apiService.getCurrentUser();
      this.appRole.set(currentUser.role);

      if (currentUser.role === 'admin') {
        this.loadAdminUsers();
      }

      console.log('Current user:', currentUser);

      if (!currentUser.workName) {
        this.username.set('Not assigned');
        this.personName.set('Not assigned');
        this.scheduleRecords.set([]);
        this.statusMessage.set(
          'Your work name has not been assigned yet. Please contact an administrator.',
        );
        return;
      }

      this.username.set(currentUser.workName);
      this.personName.set(currentUser.workName);
      this.loadTodaySales();
      this.loadSalesHistory();

      this.loadShiftsFromDatabase();
    } catch (error) {
      console.error('Failed to initialize secure session', error);

      this.username.set('Guest');
      this.personName.set('Guest');
      this.scheduleRecords.set([]);
      this.statusMessage.set('Please open this app through Telegram to load your schedule.');
    }
  }

  setFile(file: File): void {
    this.selectedFile.set(file);
    this.statusMessage.set('');
  }

  async selectBrand(brand: string): Promise<void> {
    this.selectedBrand.set(brand);

    const perfumes = await this.catalogService.getBrandPerfumes(brand);

    this.brandPerfumes.set(perfumes);
  }

  clearBrand(): void {
    this.selectedBrand.set(null);
  }

  selectAdminSchedule(telegramUserId: string): void {
    if (!telegramUserId) {
      this.showMySchedule();
      return;
    }

    const selectedUser = this.adminUsers().find((user) => user.telegram_user_id === telegramUserId);

    if (!selectedUser) {
      return;
    }

    this.statusMessage.set(`Loading ${selectedUser.work_name}'s schedule...`);

    this.adminService.getUserSchedule(telegramUserId).subscribe({
      next: (response) => {
        const records = response.shifts.map((record) => ({
          ...record,
          isPast: this.checkIsPast(record.dateStr),
          isToday: this.checkIsToday(record.dateStr),
        }));

        this.viewedAdminUser.set(response.user);
        this.scheduleDiff.set(null);
        this.scheduleRecords.set(records);
        this.statusMessage.set(
          records.length
            ? `Viewing ${response.user.work_name}'s schedule`
            : `${response.user.work_name} has no saved schedule.`,
        );
      },
      error: (error: unknown) => {
        console.error('Failed to load admin schedule', error);
        this.statusMessage.set('Could not load this schedule.');
      },
    });
  }

  showMySchedule(): void {
    this.viewedAdminUser.set(null);
    this.scheduleDiff.set(null);
    this.loadShiftsFromDatabase();
  }

  private loadAdminUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.adminUsers.set(users);
      },
      error: (error: unknown) => {
        console.error('Failed to load admin users', error);
      },
    });
  }

  private loadShiftsFromDatabase(): void {
    this.statusMessage.set('Loading schedule from database...');

    this.userService.getUser().subscribe({
      next: (response: User) => {
        console.log('Raw DB Response:', response);

        const rawRecords = response.shifts ?? [];

        if (rawRecords.length > 0) {
          const updatedRecords = rawRecords.map((record) => ({
            ...record,
            isPast: this.checkIsPast(record.dateStr),
            isToday: this.checkIsToday(record.dateStr),
          }));

          this.scheduleRecords.set(updatedRecords);
          this.statusMessage.set(`${updatedRecords.length} shifts`);
        } else {
          this.scheduleRecords.set([]);
          this.statusMessage.set('No saved shifts found in database.');
        }
      },
      error: (err) => {
        console.error('Failed to load user shifts from DB:', err);
        this.statusMessage.set('Failed to load shifts from database.');
      },
    });
  }

  async loadSchedule(): Promise<void> {
    const file = this.selectedFile();
    const name = this.personName().trim();

    if (!file || !name) {
      this.statusMessage.set('Enter your name and choose an Excel file first.');
      return;
    }

    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: 'array' });
    const targetName = name.toLowerCase();
    const rawRecords: ScheduleRecord[] = [];

    for (const tabName of workbook.SheetNames) {
      const sheet = workbook.Sheets[tabName];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');

      for (let row = Math.max(5, range.s.r); row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const person = this.getCellText(sheet, row, col);

          if (!person || !person.toLowerCase().includes(targetName)) {
            continue;
          }

          const day = this.getCellText(sheet, row, 1);
          const dateStr = this.getCellText(sheet, row, 2);
          const hours = col > 0 ? this.getCellText(sheet, row, col - 1) : '';
          const brand = this.getBrandForColumn(sheet, col);

          const lowerBrand = brand.toLowerCase();
          if (lowerBrand === 'heure pause matin' || lowerBrand === 'heure pause soir') {
            continue;
          }

          rawRecords.push({
            id: `${tabName}-${row}-${col}`,
            tabName,
            brand,
            day,
            dateStr,
            dateNumber: this.extractDayNumber(dateStr),
            startHourMinutes: this.extractStartMinutes(hours),
            hours,
            person,
            isPast: this.checkIsPast(dateStr),
            isToday: this.checkIsToday(dateStr),
          });
        }
      }
    }

    const sorted = rawRecords.sort(
      (a, b) => a.dateNumber - b.dateNumber || a.startHourMinutes - b.startHourMinutes,
    );

    const previousRecords = this.scheduleRecords();

    this.scheduleRecords.set(sorted);
    this.scheduleDiff.set(
      previousRecords.length ? this.compareSchedules(previousRecords, sorted) : null,
    );

    this.statusMessage.set(
      sorted.length ? `${sorted.length} shifts` : `No shifts found for "${name}".`,
    );

    this.saveSchedule(sorted);
  }

  private saveSchedule(sorted: ScheduleRecord[]): void {
    this.userService.saveUser(sorted).subscribe({
      next: (res) => console.log('Successfully saved to KV!'),
      error: (err) => console.error('Error saving:', err),
    });
  }

  private compareSchedules(
    previous: readonly ScheduleRecord[],
    current: readonly ScheduleRecord[],
  ): ScheduleDiff {
    const previousByKey = new Map(previous.map((record) => [this.shiftKey(record), record]));

    const currentByKey = new Map(current.map((record) => [this.shiftKey(record), record]));

    const added = current.filter((record) => !previousByKey.has(this.shiftKey(record)));

    const removed = previous.filter((record) => !currentByKey.has(this.shiftKey(record)));

    const changed = current.flatMap((record) => {
      const oldRecord = previousByKey.get(this.shiftKey(record));

      if (!oldRecord || oldRecord.hours === record.hours) {
        return [];
      }

      return [{ previous: oldRecord, current: record }];
    });

    return { added, removed, changed };
  }

  private shiftKey(record: ScheduleRecord): string {
    return [record.tabName, record.dateStr, record.brand]
      .map((value) => value.trim().toLowerCase())
      .join('|');
  }

  recordSale(sale: PerfumeSale): void {
    const brand = this.selectedBrand();

    if (!brand) {
      return;
    }

    this.salesService.recordSale(brand, sale).subscribe({
      next: (response) => {
        this.soldTodayCount.set(response.summary.count);
        this.todaySalesTotalCents.set(response.summary.totalCents);
      },
      error: (error: unknown) => {
        console.error('Failed to save sale', error);
      },
    });
  }

  private loadTodaySales(): void {
    this.salesService.getTodaySummary().subscribe({
      next: (summary) => {
        this.soldTodayCount.set(summary.count);
        this.todaySalesTotalCents.set(summary.totalCents);
      },
      error: (error: unknown) => {
        console.error('Failed to load today sales', error);
      },
    });
  }

  private loadSalesHistory(): void {
    this.salesService.getRecentHistory(31).subscribe({
      next: (history) => {
        this.salesHistory.set(history);
      },
      error: (error: unknown) => {
        console.error('Failed to load sales history', error);
      },
    });
  }

  private getCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[address];
    return cell ? XLSX.utils.format_cell(cell).trim() : '';
  }

  private getBrandForColumn(sheet: XLSX.WorkSheet, col: number): string {
    for (let currentCol = col; currentCol >= 0; currentCol--) {
      const brand = this.getCellText(sheet, 4, currentCol);
      if (brand) return brand;
    }
    return 'Unknown Brand';
  }

  private extractDayNumber(dateStr: string): number {
    const match = dateStr.match(/\d+/);
    return match ? Number(match[0]) : 99;
  }

  private extractStartMinutes(hours: string): number {
    const start = hours.split('-')[0]?.trim().toLowerCase() ?? '';
    const timeMatch = start.match(/(\d{1,2})\s*[h:]\s*(\d{1,2})?/);

    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2] ?? 0);
    }

    const hourMatch = start.match(/\d+/);
    return hourMatch ? Number(hourMatch[0]) * 60 : 9999;
  }

  private checkIsPast(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(shiftDate.getTime()) && shiftDate < today;
  }

  private checkIsToday(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(shiftDate.getTime()) && shiftDate.getTime() === today.getTime();
  }
}

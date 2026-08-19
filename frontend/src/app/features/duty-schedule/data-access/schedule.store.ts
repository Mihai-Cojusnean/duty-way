import { Injectable, inject, signal, computed } from '@angular/core';
import * as XLSX from 'xlsx';
import { TelegramService } from '../../../core/telegram.service';
import { Perfume, ScheduleRecord, CatalogMap } from '../models/duty.models';
import { ShiftService } from '../../../services/shift.service';

const INITIAL_CATALOG: CatalogMap = {
  BVLGARI: [
    {
      id: 'tygar-extrait',
      name: 'Tygar Extrait',
      price: '125ml - 421€\u2003|\u200360ml - 315€',
      creator: 'Jacques Cavallier',
      description:
        'Un voyage nocturne dans l’État de Kerala, surnommé « le jardin d’épices de l’Inde ». ' +
        'Une déclinaison olfactive hautement concentrée de Le Gemme Tygar Eau de Parfum. ' +
        'Élaboré autour d’accords de pamplemousse intense et d’ambre gris exceptionnel, il ' +
        'magnifie les notes boisées et hespéridées intenses avec une profondeur et une ' +
        'sensualité raffinées',
      notes: 'Grapefruit, Ambergris, Amber, Citruses, Peru balsam',
      longevity: '7h',
      sillage: 'Strong',
      imageUrl: 'https://fimgs.net/himg/o.DXPPaVxpeWO.png',
      pros: [
        'Parfum estival luxueux',
        'Les notes d’agrumes et de bois se marient à merveille',
        'Ouverture réaliste et juteuse de pamplemousse',
        'Profil d’ambroxan doux et de haute qualité',
        'Caractère élégant, masculin et sophistiqué',
        'Composition harmonieuse et mémorable',
        'Sillage puissant pour un parfum frais',
      ],
    },
    {
      id: 'amunae',
      name: 'Amunae',
      price: '125ml - 324€',
      creator: 'Sophie Labbé',
      description: '',
      notes: 'Jasmine, Aldehydes, Musk, Ambrette, Oak, Olibanum',
      longevity: '7h',
      sillage: 'Strong',
      imageUrl: 'https://fimgs.net/himg/o.A9xHVWihKSF.jpg',
      pros: [
        'Luxurious summer scent',
        'Citrusy and woody notes blend beautifully',
        'Realistic, juicy grapefruit opening',
        'Smooth, high-quality ambroxan profile',
        'Suave, masculine, and sophisticated character',
        'Beautifully blended and memorable',
        'Strong sillage for a fresh fragrance',
      ],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class ScheduleStore {
  private readonly telegramService = inject(TelegramService);
  private readonly shiftService = inject(ShiftService);

  // State Signals
  readonly username = signal<string>('');
  readonly personName = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly scheduleRecords = signal<ScheduleRecord[]>([]);
  readonly statusMessage = signal<string>('');
  readonly selectedBrand = signal<string | null>(null);
  readonly soldTodayCount = signal<number>(0);
  readonly catalog = signal<CatalogMap>(INITIAL_CATALOG);

  // Computed Projections
  readonly brandPerfumes = computed(() => {
    const brand = this.selectedBrand();
    return brand ? (this.catalog()[brand] ?? []) : [];
  });

  constructor() {
    this.telegramService.init();
    const user = this.telegramService.getUser();

    if (user) {
      this.username.set(user.username ? `@${user.username}` : user.first_name);

      // Attempt to load shifts from the database for existing user
      this.loadShiftsFromDatabase(user.id.toString());
    }
  }

  setPersonName(name: string): void {
    this.personName.set(name);
  }

  setFile(file: File): void {
    this.selectedFile.set(file);
    this.scheduleRecords.set([]);
    this.statusMessage.set('');
  }

  selectBrand(brand: string): void {
    this.selectedBrand.set(brand);
    this.loadTodaySales(brand);
  }

  clearBrand(): void {
    this.selectedBrand.set(null);
  }

  addSale(perfume: Perfume): void {
    const brand = this.selectedBrand();
    if (!brand) return;

    const newCount = this.soldTodayCount() + 1;
    this.soldTodayCount.set(newCount);
    localStorage.setItem(this.getSalesStorageKey(brand), String(newCount));
  }

  /**
   * Fetches user shifts from the backend/database service
   */
  private loadShiftsFromDatabase(userId: string): void {
    this.statusMessage.set('Loading schedule from database...');

    // Assuming your ShiftService has a method to fetch by userId or telegram ID
    this.shiftService.getUserData().subscribe({
      next: (records: ScheduleRecord[]) => {
        if (records && records.length > 0) {
          // Re-calculate date properties (isPast, isToday) in case dates have changed relative to today
          const updatedRecords = records.map((record) => ({
            ...record,
            isPast: this.checkIsPast(record.dateStr),
            isToday: this.checkIsToday(record.dateStr),
          }));

          this.scheduleRecords.set(updatedRecords);
          this.statusMessage.set(`${updatedRecords.length} shifts loaded from database.`);
        } else {
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

    this.scheduleRecords.set(sorted);
    this.statusMessage.set(
      sorted.length ? `${sorted.length} shifts found` : `No schedule found for "${name}".`,
    );

    this.shiftService.saveUserData(sorted, 'button', 'text').subscribe({
      next: (response) => {
        console.log('Saved to Cloudflare KV:', response);
      },
      error: (error) => {
        console.error('Failed to save:', error);
      },
    });
  }

  private loadTodaySales(brand: string): void {
    const stored = localStorage.getItem(this.getSalesStorageKey(brand));
    this.soldTodayCount.set(stored ? Number(stored) : 0);
  }

  private getSalesStorageKey(brand: string): string {
    const date = new Date().toISOString().slice(0, 10);
    const userId = this.telegramService.getUser()?.id ?? 'local-user';
    return `duty-way-sales-${userId}-${brand}-${date}`;
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

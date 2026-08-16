import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { TelegramService } from './core/telegram.service';

interface ScheduleRecord {
  id: string;
  tabName: string;
  brand: string;
  day: string;
  dateStr: string;
  dateNumber: number;
  startHourMinutes: number;
  hours: string;
  person: string;
}

interface Perfume {
  id: string;
  name: string;
  price: string;
  creator: string;
  notes: string;
  longevity: string;
  testerLocation: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  username = '';
  personName = '';
  selectedFile?: File;
  records: ScheduleRecord[] = [];
  message = '';
  selectedBrand: string | null = null;
  catalogSearch = '';
  selectedPerfume: Perfume | null = null;
  soldToday = 0;

  // We will add perfumes here manually later.
  catalog: Record<string, Perfume[]> = {
    BVLGARI: [
      {
        id: 'tygar-extrait',
        name: 'Tygar Extrait',
        price: '125ml - 434€\u2003|\u200360ml - 315€',
        creator: 'Jacques Cavallier',
        notes: 'Grapefruit, ambergris, amber, citruses, Peru balsam',
        longevity: '7h',
        testerLocation: 'Not specified',
      },
      {
        id: 'amunae',
        name: 'Amunae',
        price: '125ml - 324€',
        creator: 'Sophie Labbé',
        notes: 'Jasmine, aldehydes, musk, ambrette, oak, olibanum',
        longevity: '7h',
        testerLocation: 'Not specified',
      },
    ],
  };

  constructor(
    private telegramService: TelegramService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.telegramService.init();

    const user = this.telegramService.getUser();
    if (user) {
      this.username = user.username ? `@${user.username}` : user.first_name;
    }
  }

  onNameChanged(event: Event): void {
    this.personName = (event.target as HTMLInputElement).value;
  }

  onFileSelected(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files?.[0];
    this.records = [];
    this.message = '';
  }

  async findSchedule(): Promise<void> {
    if (!this.selectedFile || !this.personName.trim()) {
      this.message = 'Enter your name and choose an Excel file first.';
      return;
    }

    const fileData = await this.selectedFile.arrayBuffer();
    const workbook = XLSX.read(fileData, { type: 'array' });
    const targetName = this.personName.trim().toLowerCase();

    const records: ScheduleRecord[] = [];

    for (const tabName of workbook.SheetNames) {
      const sheet = workbook.Sheets[tabName];
      const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');

      // Start at Excel row 6, matching your Java code.
      for (let row = Math.max(5, range.s.r); row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const person = this.cellText(sheet, row, col);

          if (!person || !person.toLowerCase().includes(targetName)) {
            continue;
          }

          const day = this.cellText(sheet, row, 1);
          const dateStr = this.cellText(sheet, row, 2);
          const hours = col > 0 ? this.cellText(sheet, row, col - 1) : '';
          const brand = this.getBrandForColumn(sheet, col);

          if (
            brand.toLowerCase() === 'heure pause matin' ||
            brand.toLowerCase() === 'heure pause soir'
          ) {
            continue;
          }

          records.push({
            id: `${tabName}-${row}-${col}`,
            tabName,
            brand,
            day,
            dateStr,
            dateNumber: this.extractDayNumber(dateStr),
            startHourMinutes: this.extractStartMinutes(hours),
            hours,
            person,
          });
        }
      }
    }

    this.records = records.sort(
      (a, b) => a.dateNumber - b.dateNumber || a.startHourMinutes - b.startHourMinutes,
    );

    this.message = this.records.length
      ? `${this.records.length} shifts`
      : `No schedule found for "${this.personName}".`;

    this.changeDetector.detectChanges();
  }

  openBrandCatalog(brand: string): void {
    this.selectedBrand = brand;
    this.selectedPerfume = null;
    this.catalogSearch = '';
    this.loadTodaySales();
  }

  backToSchedule(): void {
    this.selectedBrand = null;
    this.selectedPerfume = null;
  }

  private cellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[address];
    return cell ? XLSX.utils.format_cell(cell).trim() : '';
  }

  onCatalogSearch(event: Event): void {
    this.catalogSearch = (event.target as HTMLInputElement).value;
  }

  get filteredPerfumes(): Perfume[] {
    const perfumes = this.selectedBrand ? (this.catalog[this.selectedBrand] ?? []) : [];

    const search = this.catalogSearch.trim().toLowerCase();

    if (!search) {
      return perfumes;
    }

    return perfumes.filter((perfume) =>
      `${perfume.name} ${perfume.creator} ${perfume.notes}`.toLowerCase().includes(search),
    );
  }

  openPerfume(perfume: Perfume): void {
    this.selectedPerfume = perfume;
  }

  closePerfume(): void {
    this.selectedPerfume = null;
  }

  addSale(): void {
    this.soldToday += 1;
    localStorage.setItem(this.salesStorageKey(), String(this.soldToday));
    this.closePerfume();
  }

  private loadTodaySales(): void {
    this.soldToday = Number(localStorage.getItem(this.salesStorageKey())) || 0;
  }

  private salesStorageKey(): string {
    const date = new Date().toISOString().slice(0, 10);
    const userId = this.telegramService.getUser()?.id ?? 'local-user';

    return `duty-way-sales-${userId}-${this.selectedBrand}-${date}`;
  }

  private getBrandForColumn(sheet: XLSX.WorkSheet, col: number): string {
    for (let currentCol = col; currentCol >= 0; currentCol--) {
      const brand = this.cellText(sheet, 4, currentCol);
      if (brand) {
        return brand;
      }
    }

    return 'Unknown Brand';
  }

  private extractDayNumber(dateStr: string): number {
    const match = dateStr.match(/\d+/);
    return match ? Number(match[0]) : 99;
  }

  private extractStartMinutes(hours: string): number {
    const start = hours.split('-')[0]?.trim().toLowerCase() ?? '';
    const timeMatch = start.match(/(\d{1,2})\s*(?:h|:)\s*(\d{1,2})?/);

    if (timeMatch) {
      return Number(timeMatch[1]) * 60 + Number(timeMatch[2] ?? 0);
    }

    const hourMatch = start.match(/\d+/);
    return hourMatch ? Number(hourMatch[0]) * 60 : 9999;
  }

  shortDay(day: string): string {
    const shortDays: Record<string, string> = {
      lundi: 'Lun',
      mardi: 'Mar',
      mercredi: 'Mer',
      jeudi: 'Jeu',
      vendredi: 'Ven',
      samedi: 'Sam',
      dimanche: 'Dim',
    };

    return shortDays[day.trim().toLowerCase()] ?? day.slice(0, 3);
  }

  isPast(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(shiftDate.getTime()) && shiftDate < today;
  }

  isToday(dateStr: string): boolean {
    const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);
    shiftDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(shiftDate.getTime()) && shiftDate.getTime() === today.getTime();
  }
}

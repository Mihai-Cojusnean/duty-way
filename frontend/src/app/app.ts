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
      ? `${this.records.length} schedule item(s) found.`
      : `No schedule found for "${this.personName}".`;

    this.changeDetector.detectChanges();
  }

  private cellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[address];
    return cell ? XLSX.utils.format_cell(cell).trim() : '';
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
}
